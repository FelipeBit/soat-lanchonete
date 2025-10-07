import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../../../src/infrastructure/controllers/order.controller';
import { OrderApplicationService } from '../../../src/application/services/order.application.service';
import { CheckoutOrderUseCase } from '../../../src/application/use-cases/checkout-order.use-case';
import { UpdateOrderStatusUseCase } from '../../../src/application/use-cases/update-order-status.use-case';
import {
  OrderStatus,
  Order,
  PaymentStatus,
} from '../../../src/domain/entities/order.entity';
import { CreateOrderDto } from '../../../src/infrastructure/controllers/dtos/create-order.dto';
import { UpdateOrderStatusDto } from '../../../src/infrastructure/controllers/dtos/update-order-status.dto';

describe('OrderController', () => {
  let controller: OrderController;

  const mockOrderApplicationService = {
    updateOrderStatus: jest.fn(),
    findAllOrders: jest.fn(),
    findOrdersByStatus: jest.fn(),
    findOrdersByCustomerId: jest.fn(),
    findOrderById: jest.fn(),
    checkout: jest.fn(),
    getPaymentStatus: jest.fn(),
    updatePaymentStatus: jest.fn(),
    findActiveOrdersWithDetails: jest.fn(),
  };

  const mockCheckoutOrderUseCase = {
    execute: jest.fn(),
  };

  const mockUpdateOrderStatusUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderApplicationService,
          useValue: mockOrderApplicationService,
        },
        {
          provide: CheckoutOrderUseCase,
          useValue: mockCheckoutOrderUseCase,
        },
        {
          provide: UpdateOrderStatusUseCase,
          useValue: mockUpdateOrderStatusUseCase,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    const createOrderDto: CreateOrderDto = {
      customerId: '123',
      items: [
        {
          productId: '456',
          quantity: 2,
        },
      ],
    };

    it('should create a new order successfully', async () => {
      const mockOrder = new Order(
        '789',
        createOrderDto.customerId,
        null,
        createOrderDto.items,
        OrderStatus.RECEIVED,
        PaymentStatus.PENDING,
        new Date(),
        new Date(),
      );

      const mockCheckoutResponse = {
        order: {
          id: mockOrder.getId(),
          customerId: mockOrder.getCustomerId(),
          customerCPF: mockOrder.getCustomerCPF(),
          items: mockOrder.getItems(),
          status: mockOrder.getStatus(),
          paymentStatus: mockOrder.getPaymentStatus(),
          createdAt: mockOrder.getCreatedAt(),
          updatedAt: mockOrder.getUpdatedAt(),
        },
        totalAmount: 199.98,
        items: [
          {
            productId: '456',
            quantity: 2,
            price: 99.99,
            total: 199.98,
          },
        ],
      };

      mockCheckoutOrderUseCase.execute.mockResolvedValue({
        orderId: '789',
        totalAmount: 199.98,
        items: [
          {
            productId: '456',
            quantity: 2,
            price: 99.99,
            total: 199.98,
          },
        ],
        status: OrderStatus.RECEIVED,
        paymentStatus: PaymentStatus.PENDING,
      });

      const result = await controller.processCheckout(createOrderDto);

      expect(result.order.id).toBe(mockCheckoutResponse.order.id);
      expect(result.order.customerId).toBe(mockCheckoutResponse.order.customerId);
      expect(result.order.customerCPF).toBe(mockCheckoutResponse.order.customerCPF);
      expect(result.order.items).toEqual(mockCheckoutResponse.order.items);
      expect(result.order.status).toBe(mockCheckoutResponse.order.status);
      expect(result.order.paymentStatus).toBe(mockCheckoutResponse.order.paymentStatus);
      expect(result.totalAmount).toBe(mockCheckoutResponse.totalAmount);
      expect(result.items).toEqual(mockCheckoutResponse.items);
      expect(mockCheckoutOrderUseCase.execute).toHaveBeenCalledWith({
        customerId: createOrderDto.customerId,
        items: createOrderDto.items,
      });
    });
  });

  describe('updateOrderStatus', () => {
    const updateOrderStatusDto: UpdateOrderStatusDto = {
      status: OrderStatus.IN_PREPARATION,
    };

    it('should update order status successfully', async () => {
      const mockUpdatedOrder = new Order(
        '123',
        '456',
        null,
        [{ productId: 'product1', quantity: 1 }],
        OrderStatus.IN_PREPARATION,
        PaymentStatus.PENDING,
        new Date(),
        new Date(),
      );
      
      mockUpdateOrderStatusUseCase.execute.mockResolvedValue({
        orderId: '123',
        status: OrderStatus.IN_PREPARATION,
        updatedAt: new Date(),
      });

      const result = await controller.updateOrderStatus(
        '123',
        updateOrderStatusDto,
      );

      expect(result).toEqual({
        orderId: '123',
        status: OrderStatus.IN_PREPARATION,
        updatedAt: expect.any(Date),
      });
      expect(mockUpdateOrderStatusUseCase.execute).toHaveBeenCalledWith({
        orderId: '123',
        status: updateOrderStatusDto.status,
      });
    });
  });

  describe('findAllOrders', () => {
    it('should return all orders successfully', async () => {
      const mockOrders = [
        new Order(
          '123',
          '456',
          null,
          [{ productId: 'product1', quantity: 1 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date(),
          new Date(),
        ),
        new Order(
          '789',
          '456',
          null,
          [{ productId: 'product2', quantity: 2 }],
          OrderStatus.IN_PREPARATION,
          PaymentStatus.APPROVED,
          new Date(),
          new Date(),
        ),
      ];
      mockOrderApplicationService.findAllOrders.mockResolvedValue(mockOrders);

      const result = await controller.getAllOrders();

      expect(result).toEqual(mockOrders);
      expect(mockOrderApplicationService.findAllOrders).toHaveBeenCalled();
    });
  });

  describe('findOrdersByStatus', () => {
    it('should return orders by status successfully', async () => {
      const mockOrders = [
        new Order(
          '123',
          '456',
          null,
          [{ productId: 'product1', quantity: 1 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date(),
          new Date(),
        ),
      ];
      mockOrderApplicationService.findOrdersByStatus.mockResolvedValue(
        mockOrders,
      );

      const result = await controller.getOrdersByStatus(OrderStatus.RECEIVED);

      expect(result).toEqual(mockOrders);
      expect(
        mockOrderApplicationService.findOrdersByStatus,
      ).toHaveBeenCalledWith(OrderStatus.RECEIVED);
    });
  });

  describe('findOrdersByCustomerId', () => {
    it('should return orders by customer ID successfully', async () => {
      const mockOrders = [
        new Order(
          '123',
          '456',
          null,
          [{ productId: 'product1', quantity: 1 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date(),
          new Date(),
        ),
      ];
      mockOrderApplicationService.findOrdersByCustomerId.mockResolvedValue(
        mockOrders,
      );

      const result = await controller.getOrdersByCustomerId('456');

      expect(result).toEqual(mockOrders);
      expect(
        mockOrderApplicationService.findOrdersByCustomerId,
      ).toHaveBeenCalledWith('456');
    });
  });

  describe('findOrderById', () => {
    it('should return order by ID successfully', async () => {
      const mockOrder = new Order(
        '123',
        '456',
        null,
        [{ productId: 'product1', quantity: 1 }],
        OrderStatus.RECEIVED,
        PaymentStatus.PENDING,
        new Date(),
        new Date(),
      );
      mockOrderApplicationService.findOrderById.mockResolvedValue(mockOrder);

      const result = await controller.findOrderById('123');

      expect(result).toEqual(mockOrder);
      expect(mockOrderApplicationService.findOrderById).toHaveBeenCalledWith(
        '123',
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status successfully', async () => {
      const mockPaymentStatus = {
        orderId: '123',
        paymentStatus: PaymentStatus.APPROVED,
        isApproved: true,
      };

      mockOrderApplicationService.getPaymentStatus.mockResolvedValue(
        mockPaymentStatus,
      );

      const result = await controller.getPaymentStatus('123');

      expect(result).toEqual(mockPaymentStatus);
      expect(mockOrderApplicationService.getPaymentStatus).toHaveBeenCalledWith(
        '123',
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const mockUpdatedOrder = new Order(
        '123',
        '456',
        null,
        [{ productId: 'product1', quantity: 1 }],
        OrderStatus.RECEIVED,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      mockOrderApplicationService.updatePaymentStatus.mockResolvedValue(
        mockUpdatedOrder,
      );

      const result = await controller.updatePaymentStatus('123', {
        paymentStatus: PaymentStatus.APPROVED,
      });

      expect(result).toEqual(mockUpdatedOrder);
      expect(
        mockOrderApplicationService.updatePaymentStatus,
      ).toHaveBeenCalledWith('123', PaymentStatus.APPROVED);
    });
  });

  describe('getActiveOrdersWithDetails', () => {
    it('should return active orders with details and correct ordering', async () => {
      const mockOrdersWithDetails = [
        {
          order: new Order(
            'order1',
            'customer1',
            null,
            [{ productId: 'product1', quantity: 2 }],
            OrderStatus.READY,
            PaymentStatus.APPROVED,
            new Date('2024-01-15T10:00:00Z'),
            new Date('2024-01-15T10:00:00Z'),
          ),
          items: [
            {
              productId: 'product1',
              quantity: 2,
              productName: 'X-Burger',
              productDescription: 'Hambúrguer artesanal',
              price: 15.0,
              total: 30.0,
            },
          ],
          totalAmount: 30.0,
        },
        {
          order: new Order(
            'order2',
            'customer2',
            null,
            [{ productId: 'product2', quantity: 1 }],
            OrderStatus.IN_PREPARATION,
            PaymentStatus.APPROVED,
            new Date('2024-01-15T10:15:00Z'),
            new Date('2024-01-15T10:15:00Z'),
          ),
          items: [
            {
              productId: 'product2',
              quantity: 1,
              productName: 'Fries',
              productDescription: 'Batatas fritas crocantes',
              price: 8.0,
              total: 8.0,
            },
          ],
          totalAmount: 8.0,
        },
      ];

      mockOrderApplicationService.findActiveOrdersWithDetails.mockResolvedValue(
        mockOrdersWithDetails,
      );

      const result = await controller.getActiveOrdersWithDetails();

      expect(result).toEqual({
        orders: [
          {
            id: 'order1',
            customerId: 'customer1',
            customerCPF: null,
            status: OrderStatus.READY,
            paymentStatus: PaymentStatus.APPROVED,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            items: [
              {
                productId: 'product1',
                quantity: 2,
                productName: 'X-Burger',
                productDescription: 'Hambúrguer artesanal',
                price: 15.0,
                total: 30.0,
              },
            ],
            totalAmount: 30.0,
          },
          {
            id: 'order2',
            customerId: 'customer2',
            customerCPF: null,
            status: OrderStatus.IN_PREPARATION,
            paymentStatus: PaymentStatus.APPROVED,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            items: [
              {
                productId: 'product2',
                quantity: 1,
                productName: 'Fries',
                productDescription: 'Batatas fritas crocantes',
                price: 8.0,
                total: 8.0,
              },
            ],
            totalAmount: 8.0,
          },
        ],
        totalCount: 2,
      });

      expect(
        mockOrderApplicationService.findActiveOrdersWithDetails,
      ).toHaveBeenCalled();
    });

    it('should handle empty orders list', async () => {
      mockOrderApplicationService.findActiveOrdersWithDetails.mockResolvedValue([]);

      const result = await controller.getActiveOrdersWithDetails();

      expect(result).toEqual({
        orders: [],
        totalCount: 0,
      });

      expect(
        mockOrderApplicationService.findActiveOrdersWithDetails,
      ).toHaveBeenCalled();
    });
  });
});
