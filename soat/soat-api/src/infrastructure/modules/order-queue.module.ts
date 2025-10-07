import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderQueueEntity } from '../adapters/database/entities/order-queue.entity';
import { OrderQueueAdapter } from '../adapters/database/order-queue.adapter';
import { OrderQueueApplicationService } from '../../application/services/order-queue.application.service';
import { OrderQueueController } from '../controllers/order-queue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderQueueEntity])],
  controllers: [OrderQueueController],
  providers: [
    {
      provide: 'OrderQueuePort',
      useClass: OrderQueueAdapter,
    },
    OrderQueueApplicationService,
  ],
  exports: [OrderQueueApplicationService],
})
export class OrderQueueModule {}
