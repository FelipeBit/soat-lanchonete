import { Test, TestingModule } from '@nestjs/testing';
import { MockPaymentService } from '../../../src/application/services/mock-payment.service';
import { PaymentStatus } from '../../../src/domain/entities/order.entity';

describe('MockPaymentService', () => {
  let service: MockPaymentService;

  beforeEach(async () => {
    const mockOrder = {
      getId: () => 'order-123',
      getItems: () => [{ productId: '1', quantity: 2 }],
    };

    const mockProduct = {
      getPrice: () => 15.90,
    };

    const mockOrderPort = {
      findById: jest.fn().mockResolvedValue(mockOrder),
    };

    const mockProductPort = {
      findProductById: jest.fn().mockResolvedValue(mockProduct),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockPaymentService,
        {
          provide: 'OrderPort',
          useValue: mockOrderPort,
        },
        {
          provide: 'ProductPort',
          useValue: mockProductPort,
        },
      ],
    }).compile();

    service = module.get<MockPaymentService>(MockPaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQRCodeOrder', () => {
    it('should create a QR code order successfully', async () => {
      const orderId = 'order-123';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      const result = await service.createQRCodeOrder(
        orderId,
        description,
        notificationUrl,
      );

      expect(result).toBeDefined();
      expect(result.external_reference).toBe(orderId);
      expect(result.qr_data).toContain(orderId);
      expect(result.notification_url).toBe(notificationUrl);
      expect(result.payment_id).toBeDefined();
      expect(result.qr_code_base64).toContain('data:image/png;base64');
    });

    it('should generate unique payment IDs for different orders', async () => {
      const orderId1 = 'order-1';
      const orderId2 = 'order-2';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      const result1 = await service.createQRCodeOrder(
        orderId1,
        description,
        notificationUrl,
      );

      const result2 = await service.createQRCodeOrder(
        orderId2,
        description,
        notificationUrl,
      );

      expect(result1.payment_id).not.toBe(result2.payment_id);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status for existing payment', async () => {
      // First create a payment
      const orderId = 'order-123';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      const qrCodeResult = await service.createQRCodeOrder(
        orderId,
        description,
        notificationUrl,
      );

      const paymentId = qrCodeResult.payment_id;

      // Then get the payment status
      const result = await service.getPaymentStatus(paymentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(paymentId);
      expect(result.external_reference).toBe(orderId);
      expect(result.transaction_amount).toBe(31.8); // 15.90 * 2 = 31.8
      expect(result.status).toBe('pending');
      expect(result.payer.email).toBe('mock@example.com');
      expect(result.payer.identification.type).toBe('CPF');
    });

    it('should throw error for non-existent payment', async () => {
      const nonExistentPaymentId = 'non-existent-payment';

      await expect(service.getPaymentStatus(nonExistentPaymentId)).rejects.toThrow(
        'Payment non-existent-payment not found',
      );
    });
  });

  describe('simulatePaymentApproval', () => {
    it('should approve a pending payment', async () => {
      // First create a payment
      const orderId = 'order-123';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      const qrCodeResult = await service.createQRCodeOrder(
        orderId,
        description,
        notificationUrl,
      );

      const paymentId = qrCodeResult.payment_id;

      // Verify initial status is pending
      const initialStatus = await service.getPaymentStatus(paymentId);
      expect(initialStatus.status).toBe('pending');

      // Approve the payment
      await service.simulatePaymentApproval(paymentId);

      // Verify status changed to approved
      const finalStatus = await service.getPaymentStatus(paymentId);
      expect(finalStatus.status).toBe('approved');
    });

    it('should not change status if payment is already approved', async () => {
      // First create and approve a payment
      const orderId = 'order-123';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      const qrCodeResult = await service.createQRCodeOrder(
        orderId,
        description,
        notificationUrl,
      );

      const paymentId = qrCodeResult.payment_id;

      // Approve the payment
      await service.simulatePaymentApproval(paymentId);

      // Try to approve again
      await service.simulatePaymentApproval(paymentId);

      // Verify status remains approved
      const finalStatus = await service.getPaymentStatus(paymentId);
      expect(finalStatus.status).toBe('approved');
    });
  });

  describe('simulatePaymentRejection', () => {
    it('should reject a pending payment', async () => {
      // First create a payment
      const orderId = 'order-123';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      const qrCodeResult = await service.createQRCodeOrder(
        orderId,
        description,
        notificationUrl,
      );

      const paymentId = qrCodeResult.payment_id;

      // Verify initial status is pending
      const initialStatus = await service.getPaymentStatus(paymentId);
      expect(initialStatus.status).toBe('pending');

      // Reject the payment
      await service.simulatePaymentRejection(paymentId);

      // Verify status changed to rejected
      const finalStatus = await service.getPaymentStatus(paymentId);
      expect(finalStatus.status).toBe('rejected');
    });
  });

  describe('simulatePaymentCancellation', () => {
    it('should cancel any payment regardless of status', async () => {
      // First create a payment
      const orderId = 'order-123';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      const qrCodeResult = await service.createQRCodeOrder(
        orderId,
        description,
        notificationUrl,
      );

      const paymentId = qrCodeResult.payment_id;

      // Cancel the payment
      await service.simulatePaymentCancellation(paymentId);

      // Verify status changed to cancelled
      const finalStatus = await service.getPaymentStatus(paymentId);
      expect(finalStatus.status).toBe('cancelled');
    });
  });

  describe('getPendingPayments', () => {
    it('should return all payments in the system', async () => {
      // Create multiple payments
      const orderId1 = 'order-1';
      const orderId2 = 'order-2';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      await service.createQRCodeOrder(
        orderId1,
        description,
        notificationUrl,
      );

      await service.createQRCodeOrder(
        orderId2,
        description,
        notificationUrl,
      );

      const pendingPayments = await service.getPendingPayments();

      expect(pendingPayments).toBeDefined();
      expect(pendingPayments.length).toBeGreaterThanOrEqual(2);
      expect(pendingPayments[0]).toHaveProperty('paymentId');
      expect(pendingPayments[0]).toHaveProperty('orderId');
      expect(pendingPayments[0]).toHaveProperty('amount');
      expect(pendingPayments[0]).toHaveProperty('status');
    });
  });

  describe('mapMockStatusToPaymentStatus', () => {
    it('should map mock status to PaymentStatus enum correctly', () => {
      expect(service.mapMockStatusToPaymentStatus('pending')).toBe(PaymentStatus.PENDING);
      expect(service.mapMockStatusToPaymentStatus('approved')).toBe(PaymentStatus.APPROVED);
      expect(service.mapMockStatusToPaymentStatus('rejected')).toBe(PaymentStatus.REJECTED);
      expect(service.mapMockStatusToPaymentStatus('cancelled')).toBe(PaymentStatus.CANCELLED);
      expect(service.mapMockStatusToPaymentStatus('unknown')).toBe(PaymentStatus.PENDING);
    });
  });

  describe('validateWebhookSignature', () => {
    it('should always return true for mock service', () => {
      const payload = 'test payload';
      const signature = 'test signature';

      const result = service.validateWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });
  });

  describe('clearOldPayments', () => {
    it('should clear payments older than specified hours', async () => {
      // Create a payment
      const orderId = 'order-123';
      const totalAmount = 29.90;
      const description = 'Test order';
      const notificationUrl = 'http://localhost:3000/webhook';

      await service.createQRCodeOrder(
        orderId,
        description,
        notificationUrl,
      );

      // Get initial count
      const initialPayments = await service.getPendingPayments();
      const initialCount = initialPayments.length;

      // Clear old payments (older than 1 hour)
      await service.clearOldPayments(1);

      // Get final count
      const finalPayments = await service.getPendingPayments();
      const finalCount = finalPayments.length;

      // Since the payment was just created, it should not be cleared
      expect(finalCount).toBe(initialCount);
    });
  });
}); 