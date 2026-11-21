import { Controller, Post, Get, Body, Query, UseGuards, Request, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface ClientAuditEntry {
  id: string; at: string; actor: string; role: string; email?: string;
  action: string; entity: string; entityId?: string; summary: string; details?: string;
}

/**
 * Append-only audit trail. Portals send their entries here; nothing in the API updates or deletes them.
 * For tamper-resistance in Supabase, revoke UPDATE/DELETE on "AuditLog" from the app role (see docs/DEPLOYMENT.md).
 */
@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async ingest(@Request() req: any, @Req() raw: any, @Body() body: { entries?: ClientAuditEntry[] }) {
    const entries = (body?.entries || []).slice(0, 5000);
    if (!entries.length) return { stored: 0 };
    const res = await this.prisma.auditLog.createMany({
      skipDuplicates: true,
      data: entries.map(e => ({
        clientId: String(e.id).slice(0, 80),
        // the authenticated user is recorded as the actor; the portal's own label is kept alongside
        actorId: req.user.id,
        actorName: `${e.actor || req.user.fullName}`.slice(0, 200),
        actorRole: `${e.role || req.user.role}`.slice(0, 40),
        action: `${e.action}`.slice(0, 100),
        entity: `${e.entity}`.slice(0, 60),
        entityId: e.entityId ? `${e.entityId}`.slice(0, 100) : null,
        summary: `${e.summary || ''}`.slice(0, 1000),
        newValues: e.details ? { details: e.details } : undefined,
        occurredAt: e.at ? new Date(e.at) : new Date(),
        ipAddress: (raw.headers['x-forwarded-for'] || raw.ip || '').toString().split(',')[0].slice(0, 60),
        userAgent: `${raw.headers['user-agent'] || ''}`.slice(0, 300),
      })),
    });
    return { stored: res.count };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BOARD_MEMBER)
  async list(@Query('from') from?: string, @Query('to') to?: string, @Query('entity') entity?: string, @Query('take') take = '500') {
    return this.prisma.auditLog.findMany({
      where: {
        ...(entity ? { entity } : {}),
        ...(from || to ? { occurredAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59Z`) } : {}) } } : {}),
      },
      orderBy: { occurredAt: 'desc' },
      take: Math.min(5000, Number(take) || 500),
    });
  }
}
