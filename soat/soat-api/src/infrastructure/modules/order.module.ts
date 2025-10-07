import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../adapters/database/entities/order.entity';
import { OrderAdapter } from '../adapters/database/order.adapter';
import { OrderApplicationService } from '../../application/services/order.application.service';
import { CheckoutOrderUseCase } from '../../application/use-cases/checkout-order.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { OrderController } from '../controllers/order.controller';
import { OrderQueueModule } from './order-queue.module';
import { CustomerModule } from './customer.module';
import { ProductModule } from './product.module';
import { CustomerAdapter } from '../adapters/database/customer.adapter';
import { ProductAdapter } from '../adapters/database/product.adapter';
import { CustomerEntity } from '../adapters/database/entities/customer.entity';
import { ProductEntity } from '../adapters/database/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, CustomerEntity, ProductEntity]),
    OrderQueueModule,
    CustomerModule,
    ProductModule,
  ],
  controllers: [OrderController],
  providers: [
    {
      provide: 'OrderPort',
      useClass: OrderAdapter,
    },
    {
      provide: 'OrderRepositoryPort',
      useClass: OrderAdapter,
    },
    {
      provide: 'CustomerPort',
      useClass: CustomerAdapter,
    },
    {
      provide: 'ProductPort',
      useClass: ProductAdapter,
    },
    OrderApplicationService,
    CheckoutOrderUseCase,
    UpdateOrderStatusUseCase,
  ],
  exports: [OrderApplicationService, 'OrderPort', 'CustomerPort', 'ProductPort'],
})
export class OrderModule {}
