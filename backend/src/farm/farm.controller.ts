import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { FarmService } from './farm.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('farm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FarmController {
  constructor(private farmService: FarmService) {}

  @Roles(UserRole.FARM_WORKER, UserRole.ADMIN)
  @Post('cattle')
  async registerCattle(@Body() body: any) {
    return this.farmService.registerCattle(body);
  }

  @Roles(UserRole.FARM_WORKER, UserRole.ADMIN)
  @Post('milk-logs')
  async logDailyMilk(@Request() req: any, @Body() body: any) {
    return this.farmService.logDailyMilk({
      ...body,
      recordedById: req.user.id,
    });
  }

  @Roles(UserRole.FARM_WORKER, UserRole.ADMIN)
  @Post('health-records')
  async recordHealth(@Body() body: any) {
    return this.farmService.recordHealthEvent(body);
  }

  @Roles(UserRole.FARM_WORKER, UserRole.ADMIN, UserRole.BOARD_MEMBER)
  @Get('dashboard-metrics')
  async getMetrics(@Query('farmId') farmId?: string) {
    return this.farmService.getFarmDashboardMetrics(farmId);
  }
}

