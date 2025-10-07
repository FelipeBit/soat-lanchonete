import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookController } from '../controllers/webhook.controller';
import { WebhookService } from '../../application/services/webhook.service';
import { MercadoPagoService } from '../../application/services/mercado-pago.service';
import { OrderModule } from './order.module';

@Module({
  imports: [ConfigModule, OrderModule],
  controllers: [WebhookController],
  providers: [WebhookService, MercadoPagoService],
  exports: [WebhookService],
})
export class WebhookModule {} 