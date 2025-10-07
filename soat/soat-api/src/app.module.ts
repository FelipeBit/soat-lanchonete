import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerModule } from './infrastructure/modules/customer.module';
import { OrderModule } from './infrastructure/modules/order.module';
import { OrderQueueModule } from './infrastructure/modules/order-queue.module';
import { ProductModule } from './infrastructure/modules/product.module';
import { WebhookModule } from './infrastructure/modules/webhook.module';
import { PaymentModule } from './infrastructure/modules/payment.module';
import { MockPaymentModule } from './infrastructure/modules/mock-payment.module';
import { HealthController } from './infrastructure/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          __dirname +
            '/infrastructure/adapters/database/entities/*.entity{.ts,.js}',
        ],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    CustomerModule,
    ProductModule,
    OrderModule,
    OrderQueueModule,
    WebhookModule,
    PaymentModule,
    MockPaymentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
