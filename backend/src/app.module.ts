import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaService } from './prisma/prisma.service';

import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { RolesGuard } from './auth/roles.guard';

import { AccountingService } from './accounting/accounting.service';
import { AccountingController } from './accounting/accounting.controller';

import { SaccoService } from './sacco/sacco.service';
import { SaccoController } from './sacco/sacco.controller';

import { FarmService } from './farm/farm.service';
import { FarmController } from './farm/farm.controller';

import { CoffeeService } from './coffee/coffee.service';
import { CoffeeController } from './coffee/coffee.controller';

import { SupportService } from './support/support.service';
import { SupportController } from './support/support.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'diaspora-connect-secure-jwt-secret-key-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AuthController,
    AccountingController,
    SaccoController,
    FarmController,
    CoffeeController,
    SupportController,
  ],
  providers: [
    PrismaService,
    AuthService,
    JwtStrategy,
    RolesGuard,
    AccountingService,
    SaccoService,
    FarmService,
    CoffeeService,
    SupportService,
  ],
  exports: [PrismaService, AuthService, AccountingService],
})
export class AppModule {}

