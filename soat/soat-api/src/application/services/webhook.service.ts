import { Injectable } from '@nestjs/common';
import { OrderApplicationService } from './order.application.service';
import { MercadoPagoService } from './mercado-pago.service';
import { PaymentStatus } from '../../domain/entities/order.entity';

export interface PaymentWebhookPayload {
  id: number;
  type: string;
  data: {
    id: string;
  };
  action: string;
  date_created: string;
  user_id: number;
  api_version: string;
  live_mode: boolean;
}

export interface MercadoPagoPaymentData {
  id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  external_reference: string;
  payment_method_id: string;
  payment_type_id: string;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

export interface MercadoPagoMerchantOrderData {
  id: string;
  status: string;
  external_reference: string;
  total_amount: number;
  paid_amount: number;
  payments: MercadoPagoPaymentData[];
}

@Injectable()
export class WebhookService {
  constructor(
    private readonly orderApplicationService: OrderApplicationService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async processPaymentWebhook(
    payload: PaymentWebhookPayload,
    signature?: string,
  ): Promise<void> {
    try {
      // Validar assinatura se fornecida
      if (signature) {
        const isValid = this.mercadoPagoService.validateWebhookSignature(
          JSON.stringify(payload),
          signature,
        );
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Validar payload
      this.validateWebhookPayload(payload);

      // Processar baseado no tipo de notificação
      switch (payload.type) {
        case 'payment':
          await this.processPaymentNotification(payload.data.id);
          break;
        case 'merchant_order':
          await this.processMerchantOrderNotification(payload.data.id);
          break;
        default:
          console.log(`Unsupported webhook type: ${payload.type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  private async processPaymentNotification(paymentId: string): Promise<void> {
    try {
      // Buscar detalhes do pagamento no Mercado Pago
      const paymentData = await this.mercadoPagoService.getPaymentStatus(paymentId);
      
      if (!paymentData.external_reference) {
        throw new Error('Payment does not have external reference');
      }

      const orderId = paymentData.external_reference;
      const paymentStatus = this.mapMercadoPagoStatusToPaymentStatus(paymentData.status);

      // Atualizar status do pagamento no pedido
      await this.orderApplicationService.updatePaymentStatus(orderId, paymentStatus as PaymentStatus);

      console.log(`Payment ${paymentId} processed for order ${orderId} with status ${paymentStatus}`);
    } catch (error) {
      console.error('Error processing payment notification:', error);
      throw error;
    }
  }

  private async processMerchantOrderNotification(orderId: string): Promise<void> {
    try {
      // Buscar detalhes da ordem no Mercado Pago
      const merchantOrderData = await this.mercadoPagoService.getMerchantOrder(orderId);
      
      // Verificar se a ordem foi paga completamente
      if (merchantOrderData.status === 'closed' && merchantOrderData.paid_amount >= merchantOrderData.total_amount) {
        const paymentStatus = 'APPROVED';
        await this.orderApplicationService.updatePaymentStatus(orderId, paymentStatus as PaymentStatus);
        
        console.log(`Merchant order ${orderId} fully paid, payment status updated to ${paymentStatus}`);
      } else if (merchantOrderData.status === 'opened') {
        // Ordem ainda não foi paga completamente
        console.log(`Merchant order ${orderId} not fully paid yet`);
      }
    } catch (error) {
      console.error('Error processing merchant order notification:', error);
      throw error;
    }
  }

  private validateWebhookPayload(payload: PaymentWebhookPayload): void {
    if (!payload.id || !payload.type || !payload.data || !payload.data.id) {
      throw new Error('Invalid webhook payload structure');
    }

    if (!['payment', 'merchant_order'].includes(payload.type)) {
      throw new Error(`Unsupported webhook type: ${payload.type}`);
    }
  }

  private mapMercadoPagoStatusToPaymentStatus(mercadoPagoStatus: string): string {
    const statusMap: Record<string, string> = {
      'approved': 'APPROVED',
      'pending': 'PENDING',
      'rejected': 'REJECTED',
      'cancelled': 'CANCELLED',
      'in_process': 'PENDING',
      'authorized': 'PENDING',
      'in_mediation': 'PENDING',
      'refunded': 'CANCELLED',
      'charged_back': 'REJECTED',
    };

    return statusMap[mercadoPagoStatus] || 'PENDING';
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    return this.mercadoPagoService.validateWebhookSignature(payload, signature);
  }
} 