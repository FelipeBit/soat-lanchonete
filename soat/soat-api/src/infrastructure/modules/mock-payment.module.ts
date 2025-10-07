import { Module } from '@nestjs/common';
import { MockPaymentController } from '../controllers/mock-payment.controller';
import { MockPaymentService } from '../../application/services/mock-payment.service';
import { MockWebhookService } from '../../application/services/mock-webhook.service';
import { OrderModule } from './order.module';
import { CustomerModule } from './customer.module';
import { ProductModule } from './product.module';

@Module({
  imports: [OrderModule, CustomerModule, ProductModule],
  controllers: [MockPaymentController],
  providers: [MockPaymentService, MockWebhookService],
  exports: [MockPaymentService, MockWebhookService],
})
export class MockPaymentModule {} 