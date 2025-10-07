import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from '../../../src/application/services/mercado-pago.service';

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('TEST-6844518034684807-080315-27eaad1382457fb80c37c5f5089a6dda-204801445');
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoPagoService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('createQRCodeOrder', () => {
    it('should create QR code order successfully', async () => {
      const orderId = 'order123';
      const totalAmount = 45.50;
      const description = 'Pedido #123';
      const notificationUrl = 'https://api.example.com/webhooks/payment';

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          qr_data: '00020126580014br.gov.bcb.pix0136a629532e-7693-4849-8f96-7c4b4d4b4b4b5204000053039865405100.005802BR5913Restaurante ABC6008São Paulo62070503***6304E2CA',
          qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAA...',
        }),
      });

      const result = await service.createQRCodeOrder(
        orderId,
        totalAmount,
        description,
        notificationUrl,
      );

      expect(result).toEqual({
        qr_data: '00020126580014br.gov.bcb.pix0136a629532e-7693-4849-8f96-7c4b4d4b4b4b5204000053039865405100.005802BR5913Restaurante ABC6008São Paulo62070503***6304E2CA',
        qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAA...',
        external_reference: orderId,
        notification_url: notificationUrl,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/instore/orders/qr/seller/collectors/'),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer TEST-6844518034684807-080315-27eaad1382457fb80c37c5f5089a6dda-204801445',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            external_reference: orderId,
            title: `Pedido ${orderId}`,
            description,
            total_amount: totalAmount,
            notification_url: notificationUrl,
          }),
        }),
      );
    });

    it('should throw error when API returns error', async () => {
      const orderId = 'order123';
      const totalAmount = 45.50;
      const description = 'Pedido #123';
      const notificationUrl = 'https://api.example.com/webhooks/payment';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Invalid access token',
        }),
      });

      await expect(
        service.createQRCodeOrder(orderId, totalAmount, description, notificationUrl),
      ).rejects.toThrow('Mercado Pago API error: {"error":"Invalid access token"}');
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      const paymentId = 'payment123';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: paymentId,
          status: 'approved',
          external_reference: 'order123',
        }),
      });

      const result = await service.getPaymentStatus(paymentId);

      expect(result).toEqual({
        id: paymentId,
        status: 'approved',
        external_reference: 'order123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer TEST-6844518034684807-080315-27eaad1382457fb80c37c5f5089a6dda-204801445',
          },
        }),
      );
    });
  });

  describe('getMerchantOrder', () => {
    it('should get merchant order successfully', async () => {
      const orderId = 'order123';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: orderId,
          status: 'closed',
          external_reference: 'order123',
          total_amount: 45.50,
          paid_amount: 45.50,
        }),
      });

      const result = await service.getMerchantOrder(orderId);

      expect(result).toEqual({
        id: orderId,
        status: 'closed',
        external_reference: 'order123',
        total_amount: 45.50,
        paid_amount: 45.50,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.mercadopago.com/merchant_orders/${orderId}`,
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer TEST-6844518034684807-080315-27eaad1382457fb80c37c5f5089a6dda-204801445',
          },
        }),
      );
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate webhook signature', () => {
      const payload = '{"test": "data"}';
      const signature = 'test-signature';

      const result = service.validateWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });
  });

  describe('constructor', () => {
    it('should throw error when access token is not provided', () => {
      mockConfigService.get.mockReturnValue(null);

      expect(() => new MercadoPagoService(configService)).toThrow(
        'MERCADO_PAGO_ACCESS_TOKEN is required',
      );
    });
  });
}); 