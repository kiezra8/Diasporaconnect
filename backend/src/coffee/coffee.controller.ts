import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CoffeeService } from './coffee.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('coffee')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CoffeeController {
  constructor(private coffeeService: CoffeeService) {}

  @Roles(UserRole.SECRETARY, UserRole.FARM_WORKER, UserRole.ADMIN)
  @Post('suppliers')
  async registerSupplier(@Body() body: any) {
    return this.coffeeService.registerSupplier(body);
  }

  @Roles(UserRole.FARM_WORKER, UserRole.SECRETARY, UserRole.ADMIN)
  @Post('purchases')
  async recordPurchase(@Request() req: any, @Body() body: any) {
    return this.coffeeService.recordPurchase({
      ...body,
      recordedById: req.user.id,
    });
  }

  @Roles(UserRole.ADMIN)
  @Post('sales')
  async recordSale(@Body() body: any) {
    return this.coffeeService.recordExportSale(body);
  }

  @Roles(UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.ACCOUNTANT)
  @Get('overview')
  async getOverview() {
    return this.coffeeService.getCoffeeOverview();
  }
}

