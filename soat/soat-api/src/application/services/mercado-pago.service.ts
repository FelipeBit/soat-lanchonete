import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MercadoPagoQRCodeResponse {
  qr_data: string;
  qr_code_base64: string;
  external_reference: string;
  notification_url: string;
}

export interface MercadoPagoOrderRequest {
  external_reference: string;
  title: string;
  description: string;
  total_amount: number;
  notification_url: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly accessToken: string;
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN') || 'test-token';
    
    if (!this.accessToken || this.accessToken === 'test-token') {
      console.warn('MERCADO_PAGO_ACCESS_TOKEN not provided, using test mode');
    }
  }

  async createQRCodeOrder(
    orderId: string,
    totalAmount: number,
    description: string,
    notificationUrl: string,
  ): Promise<MercadoPagoQRCodeResponse> {
    try {
      // Para o modelo dinâmico, precisamos criar uma ordem
      const orderData: MercadoPagoOrderRequest = {
        external_reference: orderId,
        title: `Pedido ${orderId}`,
        description,
        total_amount: totalAmount,
        notification_url: notificationUrl,
      };

      // Criar a ordem no Mercado Pago
      const response = await fetch(`${this.baseUrl}/instore/orders/qr/seller/collectors/${this.getUserId()}/pos/external_pos_id/qrs`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mercado Pago API error: ${JSON.stringify(errorData)}`);
      }

      const qrData = await response.json();
      
      return {
        qr_data: qrData.qr_data,
        qr_code_base64: qrData.qr_code_base64,
        external_reference: orderId,
        notification_url: notificationUrl,
      };
    } catch (error) {
      throw new Error(`Failed to create QR code order: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async getMerchantOrder(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/merchant_orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get merchant order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get merchant order: ${error.message}`);
    }
  }

  private getUserId(): string {
    // Extrair o user_id do access token
    // O access token tem o formato: APP_USR-XXXXX-XXXXX-XXXXX
    const parts = this.accessToken.split('-');
    if (parts.length >= 2) {
      return parts[1];
    }
    throw new Error('Invalid access token format');
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    // Implementar validação de assinatura do webhook
    // Por enquanto, retorna true para desenvolvimento
    return true;
  }
} 