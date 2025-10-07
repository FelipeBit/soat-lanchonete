import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService, PaymentWebhookPayload } from '../../../src/application/services/webhook.service';
import { OrderApplicationService } from '../../../src/application/services/order.application.service';
import { MercadoPagoService } from '../../../src/application/services/mercado-pago.service';
import { PaymentStatus } from '../../../src/domain/entities/order.entity';

describe('WebhookService', () => {
  let service: WebhookService;
  let orderApplicationService: OrderApplicationService;
  let mercadoPagoService: MercadoPagoService;

  const mockOrderApplicationService = {
    updatePaymentStatus: jest.fn(),
  };

  const mockMercadoPagoService = {
    getPaymentStatus: jest.fn(),
    getMerchantOrder: jest.fn(),
    validateWebhookSignature: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: OrderApplicationService,
          useValue: mockOrderApplicationService,
        },
        {
          provide: MercadoPagoService,
          useValue: mockMercadoPagoService,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    orderApplicationService = module.get<OrderApplicationService>(OrderApplicationService);
    mercadoPagoService = module.get<MercadoPagoService>(MercadoPagoService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processPaymentWebhook', () => {
    it('should process payment notification successfully', async () => {
      const payload: PaymentWebhookPayload = {
        id: 123,
        type: 'payment',
        data: { id: 'payment123' },
        action: 'payment.created',
        date_created: '2024-01-15T10:30:00.000Z',
        user_id: 123456,
        api_version: 'v1',
        live_mode: false,
      };

      const mockPaymentData = {
        id: 'payment123',
        status: 'approved',
        external_reference: 'order123',
        transaction_amount: 45.50,
      };

      mockMercadoPagoService.getPaymentStatus.mockResolvedValue(mockPaymentData);
      mockOrderApplicationService.updatePaymentStatus.mockResolvedValue({});

      await service.processPaymentWebhook(payload);

      expect(mockMercadoPagoService.getPaymentStatus).toHaveBeenCalledWith('payment123');
      expect(mockOrderApplicationService.updatePaymentStatus).toHaveBeenCalledWith(
        'order123',
        'APPROVED',
      );
    });

    it('should process merchant order notification successfully', async () => {
      const payload: PaymentWebhookPayload = {
        id: 123,
        type: 'merchant_order',
        data: { id: 'order123' },
        action: 'merchant_order.updated',
        date_created: '2024-01-15T10:30:00.000Z',
        user_id: 123456,
        api_version: 'v1',
        live_mode: false,
      };

      const mockMerchantOrderData = {
        id: 'order123',
        status: 'closed',
        external_reference: 'order123',
        total_amount: 45.50,
        paid_amount: 45.50,
      };

      mockMercadoPagoService.getMerchantOrder.mockResolvedValue(mockMerchantOrderData);
      mockOrderApplicationService.updatePaymentStatus.mockResolvedValue({});

      await service.processPaymentWebhook(payload);

      expect(mockMercadoPagoService.getMerchantOrder).toHaveBeenCalledWith('order123');
      expect(mockOrderApplicationService.updatePaymentStatus).toHaveBeenCalledWith(
        'order123',
        'APPROVED',
      );
    });

    it('should validate webhook signature when provided', async () => {
      const payload: PaymentWebhookPayload = {
        id: 123,
        type: 'payment',
        data: { id: 'payment123' },
        action: 'payment.created',
        date_created: '2024-01-15T10:30:00.000Z',
        user_id: 123456,
        api_version: 'v1',
        live_mode: false,
      };

      const signature = 'test-signature';

      mockMercadoPagoService.validateWebhookSignature.mockReturnValue(false);
      mockMercadoPagoService.getPaymentStatus.mockResolvedValue({
        id: 'payment123',
        status: 'approved',
        external_reference: 'order123',
      });

      await expect(
        service.processPaymentWebhook(payload, signature),
      ).rejects.toThrow('Invalid webhook signature');

      expect(mockMercadoPagoService.validateWebhookSignature).toHaveBeenCalledWith(
        JSON.stringify(payload),
        signature,
      );
    });

    it('should throw error for invalid payload structure', async () => {
      const invalidPayload = {
        id: 123,
        // Missing required fields
      } as PaymentWebhookPayload;

      await expect(service.processPaymentWebhook(invalidPayload)).rejects.toThrow(
        'Invalid webhook payload structure',
      );
    });

    it('should throw error for unsupported webhook type', async () => {
      const payload: PaymentWebhookPayload = {
        id: 123,
        type: 'unsupported',
        data: { id: 'test123' },
        action: 'test.created',
        date_created: '2024-01-15T10:30:00.000Z',
        user_id: 123456,
        api_version: 'v1',
        live_mode: false,
      };

      await expect(service.processPaymentWebhook(payload)).rejects.toThrow(
        'Unsupported webhook type: unsupported',
      );
    });

    it('should handle payment without external reference', async () => {
      const payload: PaymentWebhookPayload = {
        id: 123,
        type: 'payment',
        data: { id: 'payment123' },
        action: 'payment.created',
        date_created: '2024-01-15T10:30:00.000Z',
        user_id: 123456,
        api_version: 'v1',
        live_mode: false,
      };

      const mockPaymentData = {
        id: 'payment123',
        status: 'approved',
        // Missing external_reference
      };

      mockMercadoPagoService.getPaymentStatus.mockResolvedValue(mockPaymentData);

      await expect(service.processPaymentWebhook(payload)).rejects.toThrow(
        'Payment does not have external reference',
      );
    });

    it('should handle merchant order not fully paid', async () => {
      const payload: PaymentWebhookPayload = {
        id: 123,
        type: 'merchant_order',
        data: { id: 'order123' },
        action: 'merchant_order.updated',
        date_created: '2024-01-15T10:30:00.000Z',
        user_id: 123456,
        api_version: 'v1',
        live_mode: false,
      };

      const mockMerchantOrderData = {
        id: 'order123',
        status: 'opened', // Not closed
        external_reference: 'order123',
        total_amount: 45.50,
        paid_amount: 20.00, // Less than total
      };

      mockMercadoPagoService.getMerchantOrder.mockResolvedValue(mockMerchantOrderData);

      await service.processPaymentWebhook(payload);

      expect(mockMercadoPagoService.getMerchantOrder).toHaveBeenCalledWith('order123');
      expect(mockOrderApplicationService.updatePaymentStatus).not.toHaveBeenCalled();
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate webhook signature', () => {
      const payload = '{"test": "data"}';
      const signature = 'test-signature';

      mockMercadoPagoService.validateWebhookSignature.mockReturnValue(true);

      const result = service.validateWebhookSignature(payload, signature);

      expect(result).toBe(true);
      expect(mockMercadoPagoService.validateWebhookSignature).toHaveBeenCalledWith(
        payload,
        signature,
      );
    });
  });
}); 