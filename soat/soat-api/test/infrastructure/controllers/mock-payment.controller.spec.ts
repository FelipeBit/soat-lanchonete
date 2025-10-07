import { Test, TestingModule } from '@nestjs/testing';
import { MockPaymentController } from '../../../src/infrastructure/controllers/mock-payment.controller';
import { MockPaymentService } from '../../../src/application/services/mock-payment.service';
import { MockWebhookService } from '../../../src/application/services/mock-webhook.service';
import { OrderApplicationService } from '../../../src/application/services/order.application.service';
import { Order, OrderStatus, PaymentStatus } from '../../../src/domain/entities/order.entity';
import { BadRequestException } from '@nestjs/common';

describe('MockPaymentController', () => {
  let controller: MockPaymentController;
  let mockPaymentService: jest.Mocked<MockPaymentService>;
  let mockWebhookService: jest.Mocked<MockWebhookService>;
  let mockOrderApplicationService: jest.Mocked<OrderApplicationService>;

  const mockOrder = new Order(
    'order-123',
    'customer-123',
    null,
    [{ productId: '1', quantity: 2 }],
    OrderStatus.RECEIVED,
    PaymentStatus.PENDING,
    new Date(),
    new Date(),
  );

  const mockQRCodeResponse = {
    qr_data: 'mock_qr_data_order-123_payment-456',
    qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    external_reference: 'order-123',
    notification_url: 'http://localhost:3000/mock-payments/webhook',
    payment_id: 'mock_payment_1705312200000_abc123',
  };

  beforeEach(async () => {
    const mockPaymentServiceProvider = {
      provide: MockPaymentService,
      useValue: {
        createQRCodeOrder: jest.fn(),
        getPaymentStatus: jest.fn(),
        getPendingPayments: jest.fn(),
        clearOldPayments: jest.fn(),
      },
    };

    const mockWebhookServiceProvider = {
      provide: MockWebhookService,
      useValue: {
        processPaymentWebhook: jest.fn(),
        simulatePaymentApprovalWebhook: jest.fn(),
        simulatePaymentRejectionWebhook: jest.fn(),
        simulatePaymentCancellationWebhook: jest.fn(),
      },
    };

    const mockOrderApplicationServiceProvider = {
      provide: OrderApplicationService,
      useValue: {
        findById: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MockPaymentController],
      providers: [
        mockPaymentServiceProvider,
        mockWebhookServiceProvider,
        mockOrderApplicationServiceProvider,
      ],
    }).compile();

    controller = module.get<MockPaymentController>(MockPaymentController);
    mockPaymentService = module.get(MockPaymentService);
    mockWebhookService = module.get(MockWebhookService);
    mockOrderApplicationService = module.get(OrderApplicationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully', async () => {
      const createQRCodeDto = {
        orderId: 'order-123',
        totalAmount: 29.90,
        description: 'Test order',
      };

      mockOrderApplicationService.findById.mockResolvedValue(mockOrder);
      mockPaymentService.createQRCodeOrder.mockResolvedValue(mockQRCodeResponse);

      const result = await controller.generateQRCode(createQRCodeDto);

      expect(result).toBeDefined();
      expect(result.orderId).toBe(createQRCodeDto.orderId);
      expect(result.qrData).toBe(mockQRCodeResponse.qr_data);
      expect(result.qrCodeBase64).toBe(mockQRCodeResponse.qr_code_base64);
      expect(result.totalAmount).toBe(31.8); // 15.90 * 2 = 31.8
      expect(result.description).toBe(createQRCodeDto.description);
      expect(mockOrderApplicationService.findById).toHaveBeenCalledWith(createQRCodeDto.orderId);
      expect(mockPaymentService.createQRCodeOrder).toHaveBeenCalledWith(
        createQRCodeDto.orderId,
        createQRCodeDto.description,
        expect.stringContaining('/mock-payments/webhook'),
      );
    });

    it('should throw BadRequestException when order not found', async () => {
      const createQRCodeDto = {
        orderId: 'non-existent-order',
        totalAmount: 29.90,
        description: 'Test order',
      };

      mockOrderApplicationService.findById.mockResolvedValue(null);

      await expect(controller.generateQRCode(createQRCodeDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockOrderApplicationService.findById).toHaveBeenCalledWith(createQRCodeDto.orderId);
    });

    it('should throw BadRequestException when order is not in pending status', async () => {
      const approvedOrder = new Order(
        'order-123',
        'customer-123',
        null,
        [{ productId: '1', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      const createQRCodeDto = {
        orderId: 'order-123',
        totalAmount: 29.90,
        description: 'Test order',
      };

      mockOrderApplicationService.findById.mockResolvedValue(approvedOrder);

      await expect(controller.generateQRCode(createQRCodeDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockOrderApplicationService.findById).toHaveBeenCalledWith(createQRCodeDto.orderId);
    });
  });

  describe('receivePaymentWebhook', () => {
    it('should process webhook successfully', async () => {
      const webhookPayload = {
        id: 123456,
        type: 'payment',
        data: { id: 'payment-123' },
        action: 'payment.updated',
        date_created: '2024-01-15T10:30:00Z',
        user_id: 123456,
        api_version: '1.0',
        live_mode: false,
      };

      mockWebhookService.processPaymentWebhook.mockResolvedValue();

      const result = await controller.receivePaymentWebhook(webhookPayload);

      expect(result).toEqual({ message: 'Mock webhook processed successfully' });
      expect(mockWebhookService.processPaymentWebhook).toHaveBeenCalledWith(webhookPayload);
    });

    it('should throw BadRequestException when webhook processing fails', async () => {
      const webhookPayload = {
        id: 123456,
        type: 'payment',
        data: { id: 'payment-123' },
        action: 'payment.updated',
        date_created: '2024-01-15T10:30:00Z',
        user_id: 123456,
        api_version: '1.0',
        live_mode: false,
      };

      const error = new Error('Webhook processing failed');
      mockWebhookService.processPaymentWebhook.mockRejectedValue(error);

      await expect(controller.receivePaymentWebhook(webhookPayload)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockWebhookService.processPaymentWebhook).toHaveBeenCalledWith(webhookPayload);
    });
  });

  describe('simulatePaymentApproval', () => {
    it('should simulate payment approval successfully', async () => {
      const paymentId = 'payment-123';

      mockWebhookService.simulatePaymentApprovalWebhook.mockResolvedValue();

      const result = await controller.simulatePaymentApproval(paymentId);

      expect(result).toEqual({
        message: 'Payment approved successfully',
        paymentId,
      });
      expect(mockWebhookService.simulatePaymentApprovalWebhook).toHaveBeenCalledWith(paymentId);
    });

    it('should throw BadRequestException when approval fails', async () => {
      const paymentId = 'payment-123';

      const error = new Error('Payment not found');
      mockWebhookService.simulatePaymentApprovalWebhook.mockRejectedValue(error);

      await expect(controller.simulatePaymentApproval(paymentId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockWebhookService.simulatePaymentApprovalWebhook).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('simulatePaymentRejection', () => {
    it('should simulate payment rejection successfully', async () => {
      const paymentId = 'payment-123';

      mockWebhookService.simulatePaymentRejectionWebhook.mockResolvedValue();

      const result = await controller.simulatePaymentRejection(paymentId);

      expect(result).toEqual({
        message: 'Payment rejected successfully',
        paymentId,
      });
      expect(mockWebhookService.simulatePaymentRejectionWebhook).toHaveBeenCalledWith(paymentId);
    });

    it('should throw BadRequestException when rejection fails', async () => {
      const paymentId = 'payment-123';

      const error = new Error('Payment not found');
      mockWebhookService.simulatePaymentRejectionWebhook.mockRejectedValue(error);

      await expect(controller.simulatePaymentRejection(paymentId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockWebhookService.simulatePaymentRejectionWebhook).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('simulatePaymentCancellation', () => {
    it('should simulate payment cancellation successfully', async () => {
      const paymentId = 'payment-123';

      mockWebhookService.simulatePaymentCancellationWebhook.mockResolvedValue();

      const result = await controller.simulatePaymentCancellation(paymentId);

      expect(result).toEqual({
        message: 'Payment cancelled successfully',
        paymentId,
      });
      expect(mockWebhookService.simulatePaymentCancellationWebhook).toHaveBeenCalledWith(paymentId);
    });

    it('should throw BadRequestException when cancellation fails', async () => {
      const paymentId = 'payment-123';

      const error = new Error('Payment not found');
      mockWebhookService.simulatePaymentCancellationWebhook.mockRejectedValue(error);

      await expect(controller.simulatePaymentCancellation(paymentId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockWebhookService.simulatePaymentCancellationWebhook).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status successfully', async () => {
      const paymentId = 'payment-123';
      const mockPaymentData = {
        id: paymentId,
        status: 'approved',
        status_detail: 'Pagamento aprovado',
        transaction_amount: 29.90,
        external_reference: 'order-123',
        payment_method_id: 'mock_pix',
        payment_type_id: 'credit_card',
        date_created: '2024-01-15T10:30:00Z',
        date_approved: '2024-01-15T10:35:00Z',
        date_last_updated: '2024-01-15T10:35:00Z',
        payer: {
          email: 'mock@example.com',
          identification: {
            type: 'CPF',
            number: '12345678901',
          },
        },
      };

      mockPaymentService.getPaymentStatus.mockResolvedValue(mockPaymentData);

      const result = await controller.getPaymentStatus(paymentId);

      expect(result).toEqual({
        paymentId,
        status: mockPaymentData.status,
        statusDetail: mockPaymentData.status_detail,
        amount: mockPaymentData.transaction_amount,
        orderId: mockPaymentData.external_reference,
        createdAt: mockPaymentData.date_created,
        updatedAt: mockPaymentData.date_last_updated,
        payer: mockPaymentData.payer,
      });
      expect(mockPaymentService.getPaymentStatus).toHaveBeenCalledWith(paymentId);
    });

    it('should throw BadRequestException when payment not found', async () => {
      const paymentId = 'non-existent-payment';

      const error = new Error('Payment not found');
      mockPaymentService.getPaymentStatus.mockRejectedValue(error);

      await expect(controller.getPaymentStatus(paymentId)).rejects.toThrow(BadRequestException);
      expect(mockPaymentService.getPaymentStatus).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('getPendingPayments', () => {
    it('should return pending payments successfully', async () => {
      const mockPayments = [
        {
          paymentId: 'payment-1',
          orderId: 'order-1',
          amount: 29.90,
          status: 'pending',
        },
        {
          paymentId: 'payment-2',
          orderId: 'order-2',
          amount: 15.90,
          status: 'pending',
        },
      ];

      mockPaymentService.getPendingPayments.mockResolvedValue(mockPayments);

      const result = await controller.getPendingPayments();

      expect(result).toEqual({ payments: mockPayments });
      expect(mockPaymentService.getPendingPayments).toHaveBeenCalled();
    });

    it('should throw BadRequestException when getting pending payments fails', async () => {
      const error = new Error('Failed to get pending payments');
      mockPaymentService.getPendingPayments.mockRejectedValue(error);

      await expect(controller.getPendingPayments()).rejects.toThrow(BadRequestException);
      expect(mockPaymentService.getPendingPayments).toHaveBeenCalled();
    });
  });

  describe('clearOldPayments', () => {
    it('should clear old payments successfully', async () => {
      mockPaymentService.clearOldPayments.mockResolvedValue();

      const result = await controller.clearOldPayments();

      expect(result).toEqual({ message: 'Old payments cleared successfully' });
      expect(mockPaymentService.clearOldPayments).toHaveBeenCalledWith(24);
    });

    it('should throw BadRequestException when clearing old payments fails', async () => {
      const error = new Error('Failed to clear old payments');
      mockPaymentService.clearOldPayments.mockRejectedValue(error);

      await expect(controller.clearOldPayments()).rejects.toThrow(BadRequestException);
      expect(mockPaymentService.clearOldPayments).toHaveBeenCalledWith(24);
    });
  });
}); 