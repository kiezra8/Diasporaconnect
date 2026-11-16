import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Member Registration
   */
  async registerMember(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    countryOfResidence?: string;
    chapter?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash,
          fullName: data.fullName,
          phone: data.phone,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });

      // 2. Generate Member Number e.g. DC-MBR-00105
      const memberCount = await tx.memberProfile.count();
      const memberNumber = `DC-MBR-${String(memberCount + 101).padStart(5, '0')}`;

      // 3. Create Member Profile
      const profile = await tx.memberProfile.create({
        data: {
          userId: user.id,
          memberNumber,
          countryOfResidence: data.countryOfResidence || 'Uganda',
          chapter: data.chapter || 'Kampala',
        },
      });

      // 4. Create Ordinary Savings Account
      const savingsAccount = await tx.savingsAccount.create({
        data: {
          memberId: profile.id,
          accountNumber: `SAV-${memberNumber}`,
          accountType: 'REGULAR_SAVINGS',
          balanceUGX: 0,
        },
      });

      // 5. Generate Initial Shares (if purchased)
      const shareClass = await tx.shareClass.findFirst();
      if (shareClass) {
        await tx.shareOwnership.create({
          data: {
            memberId: profile.id,
            shareClassId: shareClass.id,
            sharesCount: 1,
            totalValueUGX: shareClass.nominalPriceUGX,
            certificateNumber: `CERT-${memberNumber}-01`,
          },
        });
      }

      const token = this.generateJwt(user);

      return {
        message: 'Account successfully registered.',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          memberNumber,
        },
        token,
      };
    });
  }

  /**
   * User Sign-In with Role-Based Redirection
   */
  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
      include: {
        memberProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended. Please contact the administrator.');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateJwt(user);

    // Map role to target portal path
    const portalRoutes: Record<UserRole, string> = {
      ADMIN: '/admin',
      BOARD_MEMBER: '/board',
      SECRETARY: '/secretary',
      ACCOUNTANT: '/accountant',
      MEMBER: '/member',
      FARM_WORKER: '/farm',
    };

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        memberNumber: user.memberProfile?.memberNumber || null,
      },
      redirectTo: portalRoutes[user.role] || '/member',
    };
  }

  /**
   * Admin invites/creates staff account with specified role.
   * SECURITY INVARIANT: Admin CANNOT view plaintext passwords or private recovery secrets.
   */
  async createStaffAccount(adminUserId: string, data: {
    email: string;
    fullName: string;
    role: UserRole;
    temporaryPassword: string;
    phone?: string;
  }) {
    if (data.role === 'MEMBER') {
      throw new BadRequestException('Use member registration for ordinary members.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.temporaryPassword, salt);

    const newUser = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Record immutable audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: 'STAFF_ACCOUNT_CREATED',
        entity: 'User',
        entityId: newUser.id,
        newValues: { email: newUser.email, role: newUser.role },
      },
    });

    return {
      message: `Staff account (${data.role}) successfully created.`,
      user: newUser,
    };
  }

  /**
   * Admin toggles staff account status (active/suspended).
   */
  async toggleStaffStatus(adminUserId: string, targetUserId: string, status: 'ACTIVE' | 'SUSPENDED') {
    if (adminUserId === targetUserId) {
      throw new BadRequestException('Cannot suspend your own administrative account.');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: { id: true, email: true, role: true, status: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: 'STAFF_STATUS_MODIFIED',
        entity: 'User',
        entityId: targetUserId,
        newValues: { status },
      },
    });

    return updated;
  }

  private generateJwt(user: { id: string; email: string; role: string; fullName: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_SECRET || 'diaspora-connect-secure-jwt-secret-key-2026',
    });
  }
}

