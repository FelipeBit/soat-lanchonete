import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhookController } from '../../../src/infrastructure/controllers/webhook.controller';
import { WebhookService, PaymentWebhookPayload } from '../../../src/application/services/webhook.service';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookService: WebhookService;

  const mockWebhookService = {
    processPaymentWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookService,
          useValue: mockWebhookService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    webhookService = module.get<WebhookService>(WebhookService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('receivePaymentWebhook', () => {
    const validPayload: PaymentWebhookPayload = {
      id: 123,
      type: 'payment',
      data: {
        id: 'payment123',
      },
      action: 'payment.created',
      date_created: '2024-01-15T10:30:00.000Z',
      user_id: 123456,
      api_version: 'v1',
      live_mode: false,
    };

    it('should process payment webhook successfully', async () => {
      mockWebhookService.processPaymentWebhook.mockResolvedValue(undefined);

      const result = await controller.receivePaymentWebhook(validPayload);

      expect(result).toEqual({
        message: 'Webhook processed successfully',
      });
      expect(mockWebhookService.processPaymentWebhook).toHaveBeenCalledWith(
        validPayload,
        undefined,
      );
    });

    it('should process payment webhook with signature', async () => {
      const signature = 'test-signature';
      mockWebhookService.processPaymentWebhook.mockResolvedValue(undefined);

      const result = await controller.receivePaymentWebhook(validPayload, signature);

      expect(result).toEqual({
        message: 'Webhook processed successfully',
      });
      expect(mockWebhookService.processPaymentWebhook).toHaveBeenCalledWith(
        validPayload,
        signature,
      );
    });

    it('should handle different payment statuses', async () => {
      const merchantOrderPayload: PaymentWebhookPayload = {
        id: 124,
        type: 'merchant_order',
        data: {
          id: 'order123',
        },
        action: 'merchant_order.updated',
        date_created: '2024-01-15T10:30:00.000Z',
        user_id: 123456,
        api_version: 'v1',
        live_mode: false,
      };

      mockWebhookService.processPaymentWebhook.mockResolvedValue(undefined);

      const result = await controller.receivePaymentWebhook(merchantOrderPayload);

      expect(result).toEqual({
        message: 'Webhook processed successfully',
      });
      expect(mockWebhookService.processPaymentWebhook).toHaveBeenCalledWith(
        merchantOrderPayload,
        undefined,
      );
    });

    it('should throw BadRequestException when webhook processing fails', async () => {
      const error = new Error('Webhook processing failed');
      mockWebhookService.processPaymentWebhook.mockRejectedValue(error);

      await expect(
        controller.receivePaymentWebhook(validPayload),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.receivePaymentWebhook(validPayload),
      ).rejects.toThrow('Failed to process webhook: Webhook processing failed');
    });

    it('should propagate errors from webhook service', async () => {
      const error = new Error('Invalid webhook signature');
      mockWebhookService.processPaymentWebhook.mockRejectedValue(error);

      await expect(
        controller.receivePaymentWebhook(validPayload),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.receivePaymentWebhook(validPayload),
      ).rejects.toThrow('Failed to process webhook: Invalid webhook signature');
    });
  });
}); 