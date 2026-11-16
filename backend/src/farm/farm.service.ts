import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FarmService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register a new cattle unit with Tag and QR Code.
   */
  async registerCattle(data: {
    tagNumber: string;
    breed: string;
    name?: string;
    sex?: string;
    stage?: any;
    paddockNumber?: string;
    farmId: string;
    projectId?: string;
    acquisitionCostUGX?: number;
  }) {
    const existing = await this.prisma.cattle.findUnique({
      where: { tagNumber: data.tagNumber },
    });

    if (existing) {
      throw new BadRequestException(`Cattle with Tag Number ${data.tagNumber} already exists in registry.`);
    }

    const qrCode = `QR-DC-CATTLE-${data.tagNumber}`;

    return this.prisma.cattle.create({
      data: {
        tagNumber: data.tagNumber,
        qrCode,
        name: data.name || data.tagNumber,
        breed: data.breed,
        sex: data.sex || 'Female',
        stage: data.stage || 'MILKING',
        paddockNumber: data.paddockNumber || 'Paddock 1',
        farmId: data.farmId,
        projectId: data.projectId,
        acquisitionCostUGX: data.acquisitionCostUGX || 4000000.00,
      },
    });
  }

  /**
   * Log daily milk collection across morning, afternoon, and evening sessions.
   */
  async logDailyMilk(data: {
    farmId: string;
    morningLiters: number;
    afternoonLiters?: number;
    eveningLiters: number;
    chillingTempCelsius?: number;
    offTakerName?: string;
    ratePerLiterUGX?: number;
    recordedById: string;
  }) {
    const morning = Number(data.morningLiters || 0);
    const afternoon = Number(data.afternoonLiters || 0);
    const evening = Number(data.eveningLiters || 0);
    const total = morning + afternoon + evening;
    const rate = Number(data.ratePerLiterUGX || 1650);
    const totalRevenue = total * rate;

    return this.prisma.milkProductionLog.create({
      data: {
        farmId: data.farmId,
        morningLiters: morning,
        afternoonLiters: afternoon,
        eveningLiters: evening,
        totalLiters: total,
        chillingTempCelsius: data.chillingTempCelsius || 3.8,
        offTakerName: data.offTakerName || 'Brookside Dairy Uganda',
        ratePerLiterUGX: rate,
        totalRevenueUGX: totalRevenue,
        recordedById: data.recordedById,
      },
    });
  }

  /**
   * Record vaccination or treatment for animal.
   */
  async recordHealthEvent(data: {
    cattleId: string;
    eventType: string; // VACCINATION | TREATMENT | DEWORMING
    conditionOrVaccine: string;
    drugAdministered?: string;
    dosage?: string;
    withdrawalPeriodDays?: number;
    notes?: string;
  }) {
    return this.prisma.cattleHealthRecord.create({
      data: {
        cattleId: data.cattleId,
        eventType: data.eventType,
        conditionOrVaccine: data.conditionOrVaccine,
        drugAdministered: data.drugAdministered,
        dosage: data.dosage,
        withdrawalPeriodDays: data.withdrawalPeriodDays || 0,
        notes: data.notes,
      },
    });
  }

  /**
   * Get farm operations overview metrics.
   */
  async getFarmDashboardMetrics(farmId?: string) {
    const whereFarm = farmId ? { farmId } : {};

    const totalCattle = await this.prisma.cattle.count({ where: whereFarm });
    const healthyCattle = await this.prisma.cattle.count({
      where: { ...whereFarm, healthStatus: 'HEALTHY' },
    });
    const sickCattle = await this.prisma.cattle.count({
      where: { ...whereFarm, healthStatus: 'SICK' },
    });
    const milkingCattle = await this.prisma.cattle.count({
      where: { ...whereFarm, stage: 'MILKING' },
    });

    const recentMilkLogs = await this.prisma.milkProductionLog.findMany({
      where: whereFarm,
      orderBy: { date: 'desc' },
      take: 7,
    });

    const totalMilkThisWeek = recentMilkLogs.reduce((sum, log) => sum + Number(log.totalLiters), 0);
    const totalRevenueThisWeek = recentMilkLogs.reduce((sum, log) => sum + Number(log.totalRevenueUGX), 0);

    return {
      totalCattle,
      healthyCattle,
      sickCattle,
      milkingCattle,
      totalMilkThisWeek,
      totalRevenueThisWeek,
      recentMilkLogs,
    };
  }
}

