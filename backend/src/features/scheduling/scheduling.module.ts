import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SchedulerMetadataAccessor } from '@nestjs/schedule/dist/schedule-metadata.accessor';
import { ScheduleExplorer } from '@nestjs/schedule/dist/schedule.explorer';
import { SchedulerOrchestrator } from '@nestjs/schedule/dist/scheduler.orchestrator';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [ProductsModule, OrdersModule, DiscoveryModule],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    SchedulerMetadataAccessor,
    SchedulerOrchestrator,
    ScheduleExplorer,
    SchedulerRegistry,
  ],
})
export class SchedulingModule {}
