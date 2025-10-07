import { Test, TestingModule } from '@nestjs/testing';
import { OrderApplicationService } from '../../../src/application/services/order.application.service';
import { OrderQueueApplicationService } from '../../../src/application/services/order-queue.application.service';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../../src/domain/entities/order.entity';
import { Customer } from '../../../src/domain/entities/customer.entity';
import {
  Product,
  ProductCategory,
} from '../../../src/domain/entities/product.entity';
import {
  OrderNotFoundException,
  EmptyOrderException,
} from '../../../src/domain/exceptions/order.exception';
import { CustomerNotFoundException } from '../../../src/domain/exceptions/customer.exception';

describe('OrderApplicationService', () => {
  let service: OrderApplicationService;

  const mockOrderPort = {
    save: jest.fn(),
    findById: jest.fn(),
    addItemsToOrder: jest.fn(),
    removeItemFromOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    updatePaymentStatus: jest.fn(),
    findAllOrders: jest.fn(),
    findOrdersByStatus: jest.fn(),
    findOrdersByCustomerId: jest.fn(),
  };

  const mockCustomerPort = {
    findById: jest.fn(),
    save: jest.fn(),
    findByCPF: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockProductPort = {
    findProductById: jest.fn(),
    save: jest.fn(),
    findAllProducts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderApplicationService,
        {
          provide: 'OrderPort',
          useValue: mockOrderPort,
        },
        {
          provide: 'CustomerPort',
          useValue: mockCustomerPort,
        },
        {
          provide: 'ProductPort',
          useValue: mockProductPort,
        },
        {
          provide: OrderQueueApplicationService,
          useValue: {
            addOrderToQueue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderApplicationService>(OrderApplicationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    it('should create an order successfully with customerId', async () => {
      const customerId = 'customer123';
      const items = [{ productId: 'product123', quantity: 2 }];

      const mockCustomer = new Customer(
        customerId,
        'John Doe',
        '12345678909',
        'john@example.com',
        new Date(),
        new Date(),
      );

      const mockProduct = new Product(
        'product123',
        'Test Product',
        'Test Description',
        99.99,
        ProductCategory.BURGER,
        'http://example.com/image.jpg',
      );

      const mockOrder = new Order(
        expect.any(String),
        customerId,
        null,
        items,
        OrderStatus.RECEIVED,
        PaymentStatus.PENDING,
        expect.any(Date),
        expect.any(Date),
      );

      mockCustomerPort.findById.mockResolvedValue(mockCustomer);
      mockProductPort.findProductById.mockResolvedValue(mockProduct);
      mockOrderPort.save.mockResolvedValue(mockOrder);

      const result = await service.checkout(customerId, items);

      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('items');
      expect(result.order.id).toBeDefined();
      expect(result.order.customerId).toBe(customerId);
      expect(result.order.customerCPF).toBeNull();
      expect(result.order.items).toEqual(items);
      expect(result.order.status).toBe(OrderStatus.RECEIVED);
      expect(result.order.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(result.totalAmount).toBe(199.98); // 99.99 * 2
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        productId: 'product123',
        quantity: 2,
        price: 99.99,
        total: 199.98,
      });
      expect(mockCustomerPort.findById).toHaveBeenCalledWith(customerId);
      expect(mockProductPort.findProductById).toHaveBeenCalledWith(
        'product123',
      );
      expect(mockOrderPort.save).toHaveBeenCalledWith(expect.any(Order));
    });

    it('should create an order successfully without customerId', async () => {
      const customerId = null;
      const items = [{ productId: 'product123', quantity: 2 }];

      const mockProduct = new Product(
        'product123',
        'Test Product',
        'Test Description',
        99.99,
        ProductCategory.BURGER,
        'http://example.com/image.jpg',
      );

      const mockOrder = new Order(
        expect.any(String),
        customerId,
        null,
        items,
        OrderStatus.RECEIVED,
        PaymentStatus.PENDING,
        expect.any(Date),
        expect.any(Date),
      );

      mockProductPort.findProductById.mockResolvedValue(mockProduct);
      mockOrderPort.save.mockResolvedValue(mockOrder);

      const result = await service.checkout(customerId, items);

      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('items');
      expect(result.order.id).toBeDefined();
      expect(result.order.customerId).toBeNull();
      expect(result.order.customerCPF).toBeNull();
      expect(result.order.items).toEqual(items);
      expect(result.order.status).toBe(OrderStatus.RECEIVED);
      expect(result.order.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(result.totalAmount).toBe(199.98); // 99.99 * 2
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        productId: 'product123',
        quantity: 2,
        price: 99.99,
        total: 199.98,
      });
      expect(mockCustomerPort.findById).not.toHaveBeenCalled();
      expect(mockProductPort.findProductById).toHaveBeenCalledWith(
        'product123',
      );
      expect(mockOrderPort.save).toHaveBeenCalledWith(expect.any(Order));
    });

    it('should throw CustomerNotFoundException when customerId is not found', async () => {
      const customerId = 'customer123';
      const items = [{ productId: 'product123', quantity: 2 }];

      mockCustomerPort.findById.mockResolvedValue(null);

      await expect(service.checkout(customerId, items)).rejects.toThrow(
        CustomerNotFoundException,
      );
      expect(mockCustomerPort.findById).toHaveBeenCalledWith(customerId);
      expect(mockProductPort.findProductById).not.toHaveBeenCalled();
      expect(mockOrderPort.save).not.toHaveBeenCalled();
    });

    it('should throw error when product is not found', async () => {
      const customerId = 'customer123';
      const items = [{ productId: 'product123', quantity: 2 }];

      mockCustomerPort.findById.mockResolvedValue({} as Customer);
      mockProductPort.findProductById.mockResolvedValue(null);

      await expect(service.checkout(customerId, items)).rejects.toThrow(
        'Product with ID product123 not found',
      );
      expect(mockCustomerPort.findById).toHaveBeenCalledWith(customerId);
      expect(mockProductPort.findProductById).toHaveBeenCalledWith(
        'product123',
      );
      expect(mockOrderPort.save).not.toHaveBeenCalled();
    });

    it('should throw EmptyOrderException when items array is empty', async () => {
      const customerId = 'customer123';
      const items: { productId: string; quantity: number }[] = [];

      await expect(service.checkout(customerId, items)).rejects.toThrow(
        EmptyOrderException,
      );
      expect(mockCustomerPort.findById).not.toHaveBeenCalled();
      expect(mockProductPort.findProductById).not.toHaveBeenCalled();
      expect(mockOrderPort.save).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status successfully', async () => {
      const orderId = 'order123';
      const mockOrder = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      mockOrderPort.findById.mockResolvedValue(mockOrder);

      const result = await service.getPaymentStatus(orderId);

      expect(result).toEqual({
        orderId: orderId,
        paymentStatus: PaymentStatus.APPROVED,
        isApproved: true,
      });
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
    });

    it('should throw OrderNotFoundException when order is not found', async () => {
      const orderId = 'order123';

      mockOrderPort.findById.mockResolvedValue(null);

      await expect(service.getPaymentStatus(orderId)).rejects.toThrow(
        OrderNotFoundException,
      );
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const orderId = 'order123';
      const newPaymentStatus = PaymentStatus.APPROVED;

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

      mockOrderPort.findById.mockResolvedValue(mockOrder);
      mockOrderPort.updatePaymentStatus.mockResolvedValue(mockOrder);

      const result = await service.updatePaymentStatus(
        orderId,
        newPaymentStatus,
      );

      expect(result).toBe(mockOrder);
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderPort.updatePaymentStatus).toHaveBeenCalledWith(
        orderId,
        newPaymentStatus,
      );
    });

    it('should throw OrderNotFoundException when order is not found', async () => {
      const orderId = 'order123';
      const newPaymentStatus = PaymentStatus.APPROVED;

      mockOrderPort.findById.mockResolvedValue(null);

      await expect(
        service.updatePaymentStatus(orderId, newPaymentStatus),
      ).rejects.toThrow(OrderNotFoundException);
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderPort.updatePaymentStatus).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully when payment is approved', async () => {
      const orderId = 'order123';
      const newStatus = OrderStatus.IN_PREPARATION;

      const mockOrder = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      const updatedMockOrder = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        newStatus,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      mockOrderPort.findById.mockResolvedValue(mockOrder);
      mockOrderPort.updateOrderStatus.mockResolvedValue(updatedMockOrder);

      const result = await service.updateOrderStatus(orderId, newStatus);

      expect(result).toBe(updatedMockOrder);
      expect(result.getStatus()).toBe(newStatus);
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderPort.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        newStatus,
      );
    });

    it('should throw error when trying to change to IN_PREPARATION without approved payment', async () => {
      const orderId = 'order123';
      const newStatus = OrderStatus.IN_PREPARATION;

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

      mockOrderPort.findById.mockResolvedValue(mockOrder);

      await expect(
        service.updateOrderStatus(orderId, newStatus),
      ).rejects.toThrow(
        'O pagamento deve estar aprovado para iniciar a preparação do pedido.',
      );
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderPort.updateOrderStatus).not.toHaveBeenCalled();
    });

    it('should throw error when trying to skip order status steps', async () => {
      const orderId = 'order123';
      const newStatus = OrderStatus.READY;

      const mockOrder = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      mockOrderPort.findById.mockResolvedValue(mockOrder);

      await expect(
        service.updateOrderStatus(orderId, newStatus),
      ).rejects.toThrow('Transição de status inválida: RECEIVED -> READY');
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderPort.updateOrderStatus).not.toHaveBeenCalled();
    });

    it('should allow valid status transitions', async () => {
      const orderId = 'order123';

      // Test RECEIVED -> IN_PREPARATION (with approved payment)
      const mockOrderReceived = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      const updatedMockOrderInPrep = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.IN_PREPARATION,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      mockOrderPort.findById.mockResolvedValue(mockOrderReceived);
      mockOrderPort.updateOrderStatus.mockResolvedValue(updatedMockOrderInPrep);

      const result1 = await service.updateOrderStatus(
        orderId,
        OrderStatus.IN_PREPARATION,
      );

      expect(result1.getStatus()).toBe(OrderStatus.IN_PREPARATION);
      expect(mockOrderPort.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.IN_PREPARATION,
      );

      // Test IN_PREPARATION -> READY
      const mockOrderInPrep = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.IN_PREPARATION,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      const updatedMockOrderReady = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.READY,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      mockOrderPort.findById.mockResolvedValue(mockOrderInPrep);
      mockOrderPort.updateOrderStatus.mockResolvedValue(updatedMockOrderReady);

      const result2 = await service.updateOrderStatus(
        orderId,
        OrderStatus.READY,
      );

      expect(result2.getStatus()).toBe(OrderStatus.READY);
      expect(mockOrderPort.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.READY,
      );

      // Test READY -> FINISHED
      const mockOrderReady = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.READY,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      const updatedMockOrderFinished = new Order(
        orderId,
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.FINISHED,
        PaymentStatus.APPROVED,
        new Date(),
        new Date(),
      );

      mockOrderPort.findById.mockResolvedValue(mockOrderReady);
      mockOrderPort.updateOrderStatus.mockResolvedValue(
        updatedMockOrderFinished,
      );

      const result3 = await service.updateOrderStatus(
        orderId,
        OrderStatus.FINISHED,
      );

      expect(result3.getStatus()).toBe(OrderStatus.FINISHED);
      expect(mockOrderPort.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.FINISHED,
      );
    });

    it('should throw OrderNotFoundException when order is not found', async () => {
      const orderId = 'order123';
      const newStatus = OrderStatus.IN_PREPARATION;

      mockOrderPort.findById.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(orderId, newStatus),
      ).rejects.toThrow(OrderNotFoundException);
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
      expect(mockOrderPort.updateOrderStatus).not.toHaveBeenCalled();
    });
  });

  describe('findAllOrders', () => {
    it('should find all orders successfully', async () => {
      const mockOrders = [
        new Order(
          '123',
          'customer123',
          null,
          [{ productId: 'product123', quantity: 2 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date(),
          new Date(),
        ),
        new Order(
          '456',
          'customer456',
          null,
          [{ productId: 'product456', quantity: 1 }],
          OrderStatus.IN_PREPARATION,
          PaymentStatus.APPROVED,
          new Date(),
          new Date(),
        ),
      ];

      mockOrderPort.findAllOrders.mockResolvedValue(mockOrders);

      const result = await service.findAllOrders();

      expect(result).toEqual(mockOrders);
      expect(mockOrderPort.findAllOrders).toHaveBeenCalled();
    });
  });

  describe('findOrdersByStatus', () => {
    it('should find orders by status successfully', async () => {
      const status = OrderStatus.RECEIVED;
      const mockOrders = [
        new Order(
          '123',
          'customer123',
          null,
          [{ productId: 'product123', quantity: 2 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date(),
          new Date(),
        ),
      ];

      mockOrderPort.findOrdersByStatus.mockResolvedValue(mockOrders);

      const result = await service.findOrdersByStatus(status);

      expect(result).toEqual(mockOrders);
      expect(mockOrderPort.findOrdersByStatus).toHaveBeenCalledWith(status);
    });
  });

  describe('findOrdersByCustomerId', () => {
    it('should find orders by customer id successfully', async () => {
      const customerId = 'customer123';
      const mockOrders = [
        new Order(
          '123',
          customerId,
          null,
          [{ productId: 'product123', quantity: 2 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date(),
          new Date(),
        ),
      ];

      mockOrderPort.findOrdersByCustomerId.mockResolvedValue(mockOrders);

      const result = await service.findOrdersByCustomerId(customerId);

      expect(result).toEqual(mockOrders);
      expect(result[0]).toBeInstanceOf(Order);
      expect(result[0].getCustomerId()).toBe(customerId);
      expect(mockOrderPort.findOrdersByCustomerId).toHaveBeenCalledWith(
        customerId,
      );
    });
  });

  describe('findOrderById', () => {
    it('should find an order by id successfully', async () => {
      const orderId = 'order123';
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

      mockOrderPort.findById.mockResolvedValue(mockOrder);

      const result = await service.findOrderById(orderId);

      expect(result).toBe(mockOrder);
      expect(result).toBeInstanceOf(Order);
      expect(result.getId()).toBe(orderId);
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
    });

    it('should throw OrderNotFoundException when order is not found', async () => {
      const orderId = 'order123';

      mockOrderPort.findById.mockResolvedValue(null);

      await expect(service.findOrderById(orderId)).rejects.toThrow(
        OrderNotFoundException,
      );
      expect(mockOrderPort.findById).toHaveBeenCalledWith(orderId);
    });
  });

  describe('findActiveOrdersWithDetails', () => {
    it('should return active orders with details and correct ordering', async () => {
      const mockOrders = [
        new Order(
          'order1',
          'customer1',
          null,
          [{ productId: 'product1', quantity: 2 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date('2024-01-15T10:00:00Z'),
          new Date('2024-01-15T10:00:00Z'),
        ),
        new Order(
          'order2',
          'customer2',
          null,
          [{ productId: 'product2', quantity: 1 }],
          OrderStatus.READY,
          PaymentStatus.APPROVED,
          new Date('2024-01-15T10:30:00Z'),
          new Date('2024-01-15T10:30:00Z'),
        ),
        new Order(
          'order3',
          'customer3',
          null,
          [{ productId: 'product3', quantity: 3 }],
          OrderStatus.IN_PREPARATION,
          PaymentStatus.APPROVED,
          new Date('2024-01-15T10:15:00Z'),
          new Date('2024-01-15T10:15:00Z'),
        ),
        new Order(
          'order4',
          'customer4',
          null,
          [{ productId: 'product4', quantity: 1 }],
          OrderStatus.FINISHED,
          PaymentStatus.APPROVED,
          new Date('2024-01-15T09:00:00Z'),
          new Date('2024-01-15T09:00:00Z'),
        ),
      ];

      const mockProducts = [
        new Product(
          'product1',
          'Product 1',
          'Description 1',
          10.0,
          ProductCategory.BURGER,
        ),
        new Product(
          'product2',
          'Product 2',
          'Description 2',
          15.0,
          ProductCategory.BURGER,
        ),
        new Product(
          'product3',
          'Product 3',
          'Description 3',
          20.0,
          ProductCategory.BURGER,
        ),
        new Product(
          'product4',
          'Product 4',
          'Description 4',
          25.0,
          ProductCategory.BURGER,
        ),
      ];

      mockOrderPort.findAllOrders.mockResolvedValue(mockOrders);
      mockProductPort.findProductById
        .mockResolvedValueOnce(mockProducts[0]) // product1
        .mockResolvedValueOnce(mockProducts[1]) // product2
        .mockResolvedValueOnce(mockProducts[2]); // product3

      const result = await service.findActiveOrdersWithDetails();

      // Verificar que apenas 3 pedidos foram retornados (excluindo FINISHED)
      expect(result).toHaveLength(3);

      // Verificar ordenação: READY > IN_PREPARATION > RECEIVED
      expect(result[0].order.id).toBe('order2'); // READY
      expect(result[0].order.status).toBe(OrderStatus.READY);
      expect(result[1].order.id).toBe('order3'); // IN_PREPARATION
      expect(result[1].order.status).toBe(OrderStatus.IN_PREPARATION);
      expect(result[2].order.id).toBe('order1'); // RECEIVED
      expect(result[2].order.status).toBe(OrderStatus.RECEIVED);

      // Verificar que cada pedido tem detalhes dos produtos
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0]).toHaveProperty('productId');
      expect(result[0].items[0]).toHaveProperty('quantity');
      expect(result[0].items[0]).toHaveProperty('productName');
      expect(result[0].items[0]).toHaveProperty('productDescription');
      expect(result[0].items[0]).toHaveProperty('price');
      expect(result[0].items[0]).toHaveProperty('total');

      // Verificar que os totalAmount são calculados corretamente
      expect(result[0].totalAmount).toBeGreaterThan(0);
      expect(result[1].totalAmount).toBeGreaterThan(0);
      expect(result[2].totalAmount).toBeGreaterThan(0);

      expect(mockOrderPort.findAllOrders).toHaveBeenCalled();
      expect(mockProductPort.findProductById).toHaveBeenCalledTimes(3);
    });

    it('should handle empty orders list', async () => {
      mockOrderPort.findAllOrders.mockResolvedValue([]);

      const result = await service.findActiveOrdersWithDetails();

      expect(result).toHaveLength(0);
      expect(mockOrderPort.findAllOrders).toHaveBeenCalled();
      expect(mockProductPort.findProductById).not.toHaveBeenCalled();
    });

    it('should handle only finished orders', async () => {
      const mockOrders = [
        new Order(
          'order1',
          'customer1',
          null,
          [{ productId: 'product1', quantity: 1 }],
          OrderStatus.FINISHED,
          PaymentStatus.APPROVED,
          new Date(),
          new Date(),
        ),
      ];

      mockOrderPort.findAllOrders.mockResolvedValue(mockOrders);

      const result = await service.findActiveOrdersWithDetails();

      expect(result).toHaveLength(0);
      expect(mockOrderPort.findAllOrders).toHaveBeenCalled();
      expect(mockProductPort.findProductById).not.toHaveBeenCalled();
    });

    it('should throw error when product is not found', async () => {
      const mockOrders = [
        new Order(
          'order1',
          'customer1',
          null,
          [{ productId: 'product1', quantity: 1 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date(),
          new Date(),
        ),
      ];

      mockOrderPort.findAllOrders.mockResolvedValue(mockOrders);
      mockProductPort.findProductById.mockResolvedValue(null);

      await expect(service.findActiveOrdersWithDetails()).rejects.toThrow(
        'Product with ID product1 not found',
      );

      expect(mockOrderPort.findAllOrders).toHaveBeenCalled();
      expect(mockProductPort.findProductById).toHaveBeenCalledWith('product1');
    });

    it('should order by creation date when status is the same', async () => {
      const mockOrders = [
        new Order(
          'order1',
          'customer1',
          null,
          [{ productId: 'product1', quantity: 1 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date('2024-01-15T10:30:00Z'), // Mais novo
          new Date('2024-01-15T10:30:00Z'),
        ),
        new Order(
          'order2',
          'customer2',
          null,
          [{ productId: 'product2', quantity: 1 }],
          OrderStatus.RECEIVED,
          PaymentStatus.PENDING,
          new Date('2024-01-15T10:00:00Z'), // Mais antigo
          new Date('2024-01-15T10:00:00Z'),
        ),
      ];

      const mockProducts = [
        new Product(
          'product1',
          'Product 1',
          'Description 1',
          10.0,
          ProductCategory.BURGER,
        ),
        new Product(
          'product2',
          'Product 2',
          'Description 2',
          15.0,
          ProductCategory.BURGER,
        ),
      ];

      mockOrderPort.findAllOrders.mockResolvedValue(mockOrders);
      mockProductPort.findProductById
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);

      const result = await service.findActiveOrdersWithDetails();

      expect(result).toHaveLength(2);
      expect(result[0].order.id).toBe('order2'); // Mais antigo primeiro
      expect(result[1].order.id).toBe('order1'); // Mais novo depois
    });
  });
});
