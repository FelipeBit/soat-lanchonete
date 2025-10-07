import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from '../controllers/payment.controller';
import { MercadoPagoService } from '../../application/services/mercado-pago.service';
import { OrderModule } from './order.module';

@Module({
  imports: [ConfigModule, OrderModule],
  controllers: [PaymentController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class PaymentModule {} 