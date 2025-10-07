import { Injectable, Inject } from '@nestjs/common';
import { PaymentStatus } from '../../domain/entities/order.entity';
import { OrderPort } from '../../domain/ports/order.port';
import { ProductPort } from '../../domain/ports/product.port';

export interface MockQRCodeResponse {
  qr_data: string;
  qr_code_base64: string;
  external_reference: string;
  notification_url: string;
  payment_id: string;
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
export class MockPaymentService {
  private paymentQueue: Map<string, { orderId: string; amount: number; status: string; createdAt: Date }> = new Map();

  constructor(
    @Inject('OrderPort')
    private readonly orderPort: OrderPort,
    @Inject('ProductPort')
    private readonly productPort: ProductPort,
  ) {}

  async createQRCodeOrder(
    orderId: string,
    description: string,
    notificationUrl: string,
  ): Promise<MockQRCodeResponse> {
    // Buscar o pedido para calcular o total
    const order = await this.orderPort.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Calcular o total baseado nos itens do pedido
    let totalAmount = 0;
    for (const item of order.getItems()) {
      const product = await this.productPort.findProductById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      totalAmount += product.getPrice() * item.quantity;
    }

    // Gerar um ID único para o pagamento
    const paymentId = `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar dados mockados do QR Code
    const qrData = `mock_qr_data_${orderId}_${paymentId}`;
    const qrCodeBase64 = this.generateMockQRCodeBase64(orderId, totalAmount);
    
    // Armazenar o pagamento na fila para processamento posterior
    this.paymentQueue.set(paymentId, {
      orderId,
      amount: totalAmount,
      status: 'pending',
      createdAt: new Date(),
    });

    console.log(`[MOCK] QR Code criado para pedido ${orderId} - Payment ID: ${paymentId} - Total: R$ ${totalAmount.toFixed(2)}`);

    return {
      qr_data: qrData,
      qr_code_base64: qrCodeBase64,
      external_reference: orderId,
      notification_url: notificationUrl,
      payment_id: paymentId,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<MockPaymentData> {
    const payment = this.paymentQueue.get(paymentId);
    
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    return {
      id: paymentId,
      status: payment.status,
      status_detail: this.getStatusDetail(payment.status),
      transaction_amount: payment.amount,
      external_reference: payment.orderId,
      payment_method_id: 'mock_pix',
      payment_type_id: 'credit_card',
      date_created: payment.createdAt.toISOString(),
      date_approved: payment.status === 'approved' ? new Date().toISOString() : undefined,
      date_last_updated: new Date().toISOString(),
      payer: {
        email: 'mock@example.com',
        identification: {
          type: 'CPF',
          number: '12345678901',
        },
      },
    };
  }

  async simulatePaymentApproval(paymentId: string): Promise<void> {
    const payment = this.paymentQueue.get(paymentId);
    
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (payment.status === 'pending') {
      payment.status = 'approved';
      console.log(`[MOCK] Pagamento ${paymentId} aprovado para pedido ${payment.orderId}`);
    }
  }

  async simulatePaymentRejection(paymentId: string): Promise<void> {
    const payment = this.paymentQueue.get(paymentId);
    
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (payment.status === 'pending') {
      payment.status = 'rejected';
      console.log(`[MOCK] Pagamento ${paymentId} rejeitado para pedido ${payment.orderId}`);
    }
  }

  async simulatePaymentCancellation(paymentId: string): Promise<void> {
    const payment = this.paymentQueue.get(paymentId);
    
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    payment.status = 'cancelled';
    console.log(`[MOCK] Pagamento ${paymentId} cancelado para pedido ${payment.orderId}`);
  }

  // Método para listar todos os pagamentos pendentes (útil para testes)
  async getPendingPayments(): Promise<Array<{ paymentId: string; orderId: string; amount: number; status: string }>> {
    return Array.from(this.paymentQueue.entries()).map(([paymentId, payment]) => ({
      paymentId,
      orderId: payment.orderId,
      amount: payment.amount,
      status: payment.status,
    }));
  }

  // Método para limpar pagamentos antigos (útil para testes)
  async clearOldPayments(hoursOld: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    
    for (const [paymentId, payment] of this.paymentQueue.entries()) {
      if (payment.createdAt < cutoffTime) {
        this.paymentQueue.delete(paymentId);
      }
    }
  }

  private generateMockQRCodeBase64(orderId: string, amount: number): string {
    // Gerar um QR Code base64 mockado
    const qrData = {
      orderId,
      amount,
      timestamp: new Date().toISOString(),
      mock: true,
    };
    
    // Simular um QR Code base64 (na prática seria gerado por uma biblioteca)
    const mockQRCode = Buffer.from(JSON.stringify(qrData)).toString('base64');
    return `data:image/png;base64,${mockQRCode}`;
  }

  private getStatusDetail(status: string): string {
    const statusDetails = {
      pending: 'Pagamento pendente de aprovação',
      approved: 'Pagamento aprovado',
      rejected: 'Pagamento rejeitado',
      cancelled: 'Pagamento cancelado',
    };
    
    return statusDetails[status] || 'Status desconhecido';
  }

  // Método para mapear status do mock para PaymentStatus da aplicação
  mapMockStatusToPaymentStatus(mockStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'pending': PaymentStatus.PENDING,
      'approved': PaymentStatus.APPROVED,
      'rejected': PaymentStatus.REJECTED,
      'cancelled': PaymentStatus.CANCELLED,
    };
    
    return statusMap[mockStatus] || PaymentStatus.PENDING;
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    // Para o mock, sempre retorna true
    // Em produção, seria necessário validar a assinatura do Mercado Pago
    return true;
  }
} 