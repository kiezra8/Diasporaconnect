import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoffeeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register a new coffee farmer / outgrower supplier.
   */
  async registerSupplier(data: {
    fullName: string;
    phone: string;
    district: string;
  }) {
    const count = await this.prisma.coffeeSupplier.count();
    const code = `SUP-${data.district.slice(0, 3).toUpperCase()}-${String(count + 1).padStart(3, '0')}`;

    return this.prisma.coffeeSupplier.create({
      data: {
        code,
        fullName: data.fullName,
        phone: data.phone,
        district: data.district,
      },
    });
  }

  /**
   * Record coffee purchase batch from outgrower.
   */
  async recordPurchase(data: {
    supplierId: string;
    coffeeType: string; // 'Arabica Bugisu AA', 'Robusta Screen 18'
    grade: string;
    weightKg: number;
    moistureContentPercent: number;
    pricePerKgUGX: number;
    paymentReference?: string;
    recordedById: string;
  }) {
    if (data.weightKg <= 0 || data.pricePerKgUGX <= 0) {
      throw new BadRequestException('Weight and price per kilogram must be greater than zero.');
    }

    const totalAmountUGX = Number(data.weightKg) * Number(data.pricePerKgUGX);
    const count = await this.prisma.coffeePurchase.count();
    const batchNumber = `BATCH-CF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Record Purchase Batch
      const purchase = await tx.coffeePurchase.create({
        data: {
          batchNumber,
          supplierId: data.supplierId,
          coffeeType: data.coffeeType,
          grade: data.grade,
          weightKg: data.weightKg,
          moistureContentPercent: data.moistureContentPercent,
          pricePerKgUGX: data.pricePerKgUGX,
          totalAmountUGX,
          paymentReference: data.paymentReference,
          recordedById: data.recordedById,
        },
      });

      // 2. Increment warehouse inventory
      await tx.coffeeInventory.upsert({
        where: { coffeeType: data.coffeeType },
        update: {
          currentStockKg: { increment: data.weightKg },
          totalProcessedKg: { increment: data.weightKg },
        },
        create: {
          coffeeType: data.coffeeType,
          warehouseLocation: 'Kampala Export Processing Hub',
          currentStockKg: data.weightKg,
          totalProcessedKg: data.weightKg,
          processingLossKg: 0,
        },
      });

      return purchase;
    });
  }

  /**
   * Record an export sale with strict inventory check (Prevent overselling).
   */
  async recordExportSale(data: {
    buyerName: string;
    destinationCountry: string;
    coffeeType: string;
    grade: string;
    weightSoldKg: number;
    pricePerKgUSD: number;
    exchangeRate?: number;
  }) {
    const inventory = await this.prisma.coffeeInventory.findUnique({
      where: { coffeeType: data.coffeeType },
    });

    if (!inventory || new Prisma.Decimal(inventory.currentStockKg).lessThan(data.weightSoldKg)) {
      throw new BadRequestException(
        `Insufficient verified inventory: Available stock of ${data.coffeeType} is ${inventory ? Number(inventory.currentStockKg).toLocaleString() : 0} kg, but attempted to sell ${data.weightSoldKg.toLocaleString()} kg.`
      );
    }

    const rate = Number(data.exchangeRate || 3800);
    const totalAmountUSD = Number(data.weightSoldKg) * Number(data.pricePerKgUSD);
    const totalAmountUGX = totalAmountUSD * rate;

    const count = await this.prisma.coffeeSale.count();
    const salesOrderNumber = `SO-EXP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Record Sale Order
      const sale = await tx.coffeeSale.create({
        data: {
          salesOrderNumber,
          buyerName: data.buyerName,
          destinationCountry: data.destinationCountry,
          coffeeType: data.coffeeType,
          grade: data.grade,
          weightSoldKg: data.weightSoldKg,
          pricePerKgUSD: data.pricePerKgUSD,
          exchangeRate: rate,
          totalAmountUGX,
          paymentStatus: 'PAID',
        },
      });

      // 2. Deduct verified stock
      await tx.coffeeInventory.update({
        where: { coffeeType: data.coffeeType },
        data: {
          currentStockKg: { decrement: data.weightSoldKg },
        },
      });

      return sale;
    });
  }

  /**
   * Get coffee inventory and trading overview
   */
  async getCoffeeOverview() {
    const inventories = await this.prisma.coffeeInventory.findMany();
    const recentSales = await this.prisma.coffeeSale.findMany({
      orderBy: { date: 'desc' },
      take: 5,
    });
    const recentPurchases = await this.prisma.coffeePurchase.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      include: { supplier: true },
    });

    return {
      inventories,
      recentSales,
      recentPurchases,
    };
  }
}

