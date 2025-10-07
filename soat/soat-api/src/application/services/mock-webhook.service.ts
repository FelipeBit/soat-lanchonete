import { Injectable } from '@nestjs/common';
import { OrderApplicationService } from './order.application.service';
import { MockPaymentService } from './mock-payment.service';
import { PaymentStatus } from '../../domain/entities/order.entity';

export interface MockPaymentWebhookPayload {
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

export interface MockPaymentData {
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

@Injectable()
export class MockWebhookService {
  constructor(
    private readonly orderApplicationService: OrderApplicationService,
    private readonly mockPaymentService: MockPaymentService,
  ) {}

  async processPaymentWebhook(
    payload: MockPaymentWebhookPayload,
    signature?: string,
  ): Promise<void> {
    try {
      // Validar assinatura se fornecida
      if (signature) {
        const isValid = this.mockPaymentService.validateWebhookSignature(
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
          console.log(`[MOCK] Unsupported webhook type: ${payload.type}`);
      }
    } catch (error) {
      console.error('[MOCK] Error processing webhook:', error);
      throw error;
    }
  }

  private async processPaymentNotification(paymentId: string): Promise<void> {
    try {
      // Buscar detalhes do pagamento no serviço mockado
      const paymentData = await this.mockPaymentService.getPaymentStatus(paymentId);
      
      if (!paymentData.external_reference) {
        throw new Error('Payment does not have external reference');
      }

      const orderId = paymentData.external_reference;
      const paymentStatus = this.mapMockStatusToPaymentStatus(paymentData.status);

      // Atualizar status do pagamento no pedido
      await this.orderApplicationService.updatePaymentStatus(orderId, paymentStatus as PaymentStatus);

      console.log(`[MOCK] Payment ${paymentId} processed for order ${orderId} with status ${paymentStatus}`);
    } catch (error) {
      console.error('[MOCK] Error processing payment notification:', error);
      throw error;
    }
  }

  private async processMerchantOrderNotification(orderId: string): Promise<void> {
    try {
      // Para o mock, vamos simular que a ordem foi paga completamente
      // Em uma implementação real, buscaríamos os detalhes da ordem no Mercado Pago
      console.log(`[MOCK] Processing merchant order notification for order ${orderId}`);
      
      // Simular que a ordem foi paga
      const paymentStatus = 'APPROVED';
      await this.orderApplicationService.updatePaymentStatus(orderId, paymentStatus as PaymentStatus);
      
      console.log(`[MOCK] Merchant order ${orderId} fully paid, payment status updated to ${paymentStatus}`);
    } catch (error) {
      console.error('[MOCK] Error processing merchant order notification:', error);
      throw error;
    }
  }

  private validateWebhookPayload(payload: MockPaymentWebhookPayload): void {
    if (!payload.id || !payload.type || !payload.data || !payload.data.id) {
      throw new Error('Invalid webhook payload structure');
    }

    if (!['payment', 'merchant_order'].includes(payload.type)) {
      throw new Error(`Unsupported webhook type: ${payload.type}`);
    }
  }

  private mapMockStatusToPaymentStatus(mockStatus: string): string {
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

    return statusMap[mockStatus] || 'PENDING';
  }

  // Método para simular webhook de aprovação de pagamento
  async simulatePaymentApprovalWebhook(paymentId: string): Promise<void> {
    try {
      // Primeiro, aprovar o pagamento no serviço mockado
      await this.mockPaymentService.simulatePaymentApproval(paymentId);
      
      // Depois, processar o webhook
      const webhookPayload: MockPaymentWebhookPayload = {
        id: Date.now(),
        type: 'payment',
        data: { id: paymentId },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        user_id: 123456,
        api_version: '1.0',
        live_mode: false,
      };

      await this.processPaymentWebhook(webhookPayload);
      
      console.log(`[MOCK] Payment approval webhook simulated for payment ${paymentId}`);
    } catch (error) {
      console.error('[MOCK] Error simulating payment approval webhook:', error);
      throw error;
    }
  }

  // Método para simular webhook de rejeição de pagamento
  async simulatePaymentRejectionWebhook(paymentId: string): Promise<void> {
    try {
      // Primeiro, rejeitar o pagamento no serviço mockado
      await this.mockPaymentService.simulatePaymentRejection(paymentId);
      
      // Depois, processar o webhook
      const webhookPayload: MockPaymentWebhookPayload = {
        id: Date.now(),
        type: 'payment',
        data: { id: paymentId },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        user_id: 123456,
        api_version: '1.0',
        live_mode: false,
      };

      await this.processPaymentWebhook(webhookPayload);
      
      console.log(`[MOCK] Payment rejection webhook simulated for payment ${paymentId}`);
    } catch (error) {
      console.error('[MOCK] Error simulating payment rejection webhook:', error);
      throw error;
    }
  }

  // Método para simular webhook de cancelamento de pagamento
  async simulatePaymentCancellationWebhook(paymentId: string): Promise<void> {
    try {
      // Primeiro, cancelar o pagamento no serviço mockado
      await this.mockPaymentService.simulatePaymentCancellation(paymentId);
      
      // Depois, processar o webhook
      const webhookPayload: MockPaymentWebhookPayload = {
        id: Date.now(),
        type: 'payment',
        data: { id: paymentId },
        action: 'payment.updated',
        date_created: new Date().toISOString(),
        user_id: 123456,
        api_version: '1.0',
        live_mode: false,
      };

      await this.processPaymentWebhook(webhookPayload);
      
      console.log(`[MOCK] Payment cancellation webhook simulated for payment ${paymentId}`);
    } catch (error) {
      console.error('[MOCK] Error simulating payment cancellation webhook:', error);
      throw error;
    }
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    return this.mockPaymentService.validateWebhookSignature(payload, signature);
  }
} 