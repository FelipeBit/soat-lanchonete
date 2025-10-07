import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentController } from '../../../src/infrastructure/controllers/payment.controller';
import { OrderApplicationService } from '../../../src/application/services/order.application.service';
import { MercadoPagoService } from '../../../src/application/services/mercado-pago.service';
import { Order, OrderStatus, PaymentStatus } from '../../../src/domain/entities/order.entity';

describe('PaymentController', () => {
  let controller: PaymentController;
  let orderApplicationService: OrderApplicationService;
  let mercadoPagoService: MercadoPagoService;

  const mockOrderApplicationService = {
    findById: jest.fn(),
  };

  const mockMercadoPagoService = {
    createQRCodeOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
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

    controller = module.get<PaymentController>(PaymentController);
    orderApplicationService = module.get<OrderApplicationService>(OrderApplicationService);
    mercadoPagoService = module.get<MercadoPagoService>(MercadoPagoService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully', async () => {
      const orderId = 'order123';
      const totalAmount = 45.50;
      const description = 'Pedido #123 - 2x Hambúrguer, 1x Batata Frita';

      const mockOrder = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.PENDING,
        new Date(),
        new Date(),
      );

      const mockQRCodeData = {
        qr_data: '00020126580014br.gov.bcb.pix0136a629532e-7693-4849-8f96-7c4b4d4b4b4b5204000053039865405100.005802BR5913Restaurante ABC6008São Paulo62070503***6304E2CA',
        qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAA...',
        external_reference: orderId,
        notification_url: 'https://api.example.com/webhooks/payment',
      };

      mockOrderApplicationService.findById.mockResolvedValue(mockOrder);
      mockMercadoPagoService.createQRCodeOrder.mockResolvedValue(mockQRCodeData);

      const result = await controller.generateQRCode({
        orderId,
        totalAmount,
        description,
      });

      expect(result).toEqual({
        orderId,
        qrData: mockQRCodeData.qr_data,
        qrCodeBase64: mockQRCodeData.qr_code_base64,
        totalAmount,
        description,
        notificationUrl: mockQRCodeData.notification_url,
        createdAt: expect.any(String),
      });

      expect(mockOrderApplicationService.findById).toHaveBeenCalledWith(orderId);
      expect(mockMercadoPagoService.createQRCodeOrder).toHaveBeenCalledWith(
        orderId,
        totalAmount,
        description,
        expect.stringContaining('/webhooks/payment'),
      );
    });

    it('should throw error when order not found', async () => {
      const orderId = 'order123';
      const totalAmount = 45.50;
      const description = 'Pedido #123';

      mockOrderApplicationService.findById.mockResolvedValue(null);

      await expect(
        controller.generateQRCode({
          orderId,
          totalAmount,
          description,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.generateQRCode({
          orderId,
          totalAmount,
          description,
        }),
      ).rejects.toThrow('Order not found');
    });

    it('should throw error when order is not in pending status', async () => {
      const orderId = 'order123';
      const totalAmount = 45.50;
      const description = 'Pedido #123';

      const mockOrder = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.APPROVED, // Já aprovado
        new Date(),
        new Date(),
      );

      mockOrderApplicationService.findById.mockResolvedValue(mockOrder);

      await expect(
        controller.generateQRCode({
          orderId,
          totalAmount,
          description,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.generateQRCode({
          orderId,
          totalAmount,
          description,
        }),
      ).rejects.toThrow('Order is not in pending status');
    });

    it('should throw error when Mercado Pago service fails', async () => {
      const orderId = 'order123';
      const totalAmount = 45.50;
      const description = 'Pedido #123';

      const mockOrder = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.PENDING,
        new Date(),
        new Date(),
      );

      mockOrderApplicationService.findById.mockResolvedValue(mockOrder);
      mockMercadoPagoService.createQRCodeOrder.mockRejectedValue(
        new Error('Mercado Pago API error'),
      );

      await expect(
        controller.generateQRCode({
          orderId,
          totalAmount,
          description,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.generateQRCode({
          orderId,
          totalAmount,
          description,
        }),
      ).rejects.toThrow('Failed to generate QR code: Mercado Pago API error');
    });
  });
}); 