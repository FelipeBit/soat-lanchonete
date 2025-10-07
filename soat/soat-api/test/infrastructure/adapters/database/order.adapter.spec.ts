import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderAdapter } from '../../../../src/infrastructure/adapters/database/order.adapter';
import { OrderEntity } from '../../../../src/infrastructure/adapters/database/entities/order.entity';
import { Order, OrderStatus, PaymentStatus } from '../../../../src/domain/entities/order.entity';
import { OrderNotFoundException } from '../../../../src/domain/exceptions/order.exception';

describe('OrderAdapter', () => {
  let adapter: OrderAdapter;
  let repository: Repository<OrderEntity>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderAdapter,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    adapter = module.get<OrderAdapter>(OrderAdapter);
    repository = module.get<Repository<OrderEntity>>(getRepositoryToken(OrderEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save an order successfully', async () => {
      const order = new Order(
        '123',
        'customer123',
        null,
        [{ productId: 'product123', quantity: 2 }],
        OrderStatus.RECEIVED,
        PaymentStatus.PENDING,
        new Date(),
        new Date(),
      );

      const mockEntity = {
        id: order.getId(),
        customerId: order.getCustomerId(),
        customerCPF: order.getCustomerCPF(),
        items: order.getItems(),
        status: order.getStatus(),
        paymentStatus: order.getPaymentStatus(),
        createdAt: order.getCreatedAt(),
        updatedAt: order.getUpdatedAt(),
      };

      mockRepository.create.mockReturnValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockEntity);

      const result = await adapter.save(order);

      expect(result).toBe(order);
      expect(mockRepository.create).toHaveBeenCalledWith({
        id: order.getId(),
        customerId: order.getCustomerId(),
        customerCPF: order.getCustomerCPF(),
        items: order.getItems(),
        status: order.getStatus(),
        paymentStatus: order.getPaymentStatus(),
        createdAt: order.getCreatedAt(),
        updatedAt: order.getUpdatedAt(),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntity);
    });
  });

  describe('findById', () => {
    it('should find an order by id successfully', async () => {
      const orderId = '123';
      const mockEntity = {
        id: orderId,
        customerId: 'customer123',
        customerCPF: null,
        items: [{ productId: 'product123', quantity: 2 }],
        status: OrderStatus.RECEIVED,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await adapter.findById(orderId);

      expect(result).toBeInstanceOf(Order);
      expect(result.getId()).toBe(orderId);
      expect(result.getCustomerId()).toBe('customer123');
      expect(result.getCustomerCPF()).toBeNull();
      expect(result.getItems()).toEqual([{ productId: 'product123', quantity: 2 }]);
      expect(result.getStatus()).toBe(OrderStatus.RECEIVED);
      expect(result.getPaymentStatus()).toBe(PaymentStatus.PENDING);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
    });

    it('should throw OrderNotFoundException when order not found', async () => {
      const orderId = '123';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(adapter.findById(orderId)).rejects.toThrow(OrderNotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
    });
  });

  describe('addItemsToOrder', () => {
    it('should add items to an order successfully', async () => {
      const orderId = '123';
      const newItems = [{ productId: 'product456', quantity: 1 }];
      const mockEntity = {
        id: orderId,
        customerId: 'customer123',
        customerCPF: null,
        items: [{ productId: 'product123', quantity: 2 }],
        status: OrderStatus.RECEIVED,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedItems = [...mockEntity.items, ...newItems];

      mockRepository.findOne.mockResolvedValue(mockEntity);
      mockRepository.save.mockResolvedValue({
        ...mockEntity,
        items: expectedItems,
      });

      const result = await adapter.addItemsToOrder(orderId, newItems);

      expect(result).toBeInstanceOf(Order);
      expect(result.getId()).toBe(orderId);
      expect(result.getItems()).toEqual(expectedItems);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw OrderNotFoundException when order not found', async () => {
      const orderId = '123';
      const newItems = [{ productId: 'product456', quantity: 1 }];

      mockRepository.findOne.mockResolvedValue(null);

      await expect(adapter.addItemsToOrder(orderId, newItems)).rejects.toThrow(OrderNotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
    });
  });

  describe('removeItemFromOrder', () => {
    it('should remove an item from an order successfully', async () => {
      const orderId = '123';
      const productId = 'product123';
      const mockEntity = {
        id: orderId,
        customerId: 'customer123',
        customerCPF: null,
        items: [
          { productId: 'product123', quantity: 2 },
          { productId: 'product456', quantity: 1 },
        ],
        status: OrderStatus.RECEIVED,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockEntity);
      mockRepository.save.mockResolvedValue({
        ...mockEntity,
        items: [{ productId: 'product456', quantity: 1 }],
      });

      const result = await adapter.removeItemFromOrder(orderId, productId);

      expect(result).toBeInstanceOf(Order);
      expect(result.getId()).toBe(orderId);
      expect(result.getItems()).toEqual([{ productId: 'product456', quantity: 1 }]);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw OrderNotFoundException when order not found', async () => {
      const orderId = '123';
      const productId = 'product123';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(adapter.removeItemFromOrder(orderId, productId)).rejects.toThrow(OrderNotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const orderId = '123';
      const newStatus = OrderStatus.IN_PREPARATION;
      const mockEntity = {
        id: orderId,
        customerId: 'customer123',
        customerCPF: null,
        items: [{ productId: 'product123', quantity: 2 }],
        status: OrderStatus.RECEIVED,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockEntity);
      mockRepository.save.mockResolvedValue({
        ...mockEntity,
        status: newStatus,
      });

      const result = await adapter.updateOrderStatus(orderId, newStatus);

      expect(result).toBeInstanceOf(Order);
      expect(result.getId()).toBe(orderId);
      expect(result.getStatus()).toBe(newStatus);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw OrderNotFoundException when order not found', async () => {
      const orderId = '123';
      const newStatus = OrderStatus.IN_PREPARATION;

      mockRepository.findOne.mockResolvedValue(null);

      await expect(adapter.updateOrderStatus(orderId, newStatus)).rejects.toThrow(OrderNotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const orderId = '123';
      const newPaymentStatus = PaymentStatus.APPROVED;
      const mockEntity = {
        id: orderId,
        customerId: 'customer123',
        customerCPF: null,
        items: [{ productId: 'product123', quantity: 2 }],
        status: OrderStatus.RECEIVED,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockEntity);
      mockRepository.save.mockResolvedValue({
        ...mockEntity,
        paymentStatus: newPaymentStatus,
      });

      const result = await adapter.updatePaymentStatus(orderId, newPaymentStatus);

      expect(result).toBeInstanceOf(Order);
      expect(result.getId()).toBe(orderId);
      expect(result.getPaymentStatus()).toBe(newPaymentStatus);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw OrderNotFoundException when order not found', async () => {
      const orderId = '123';
      const newPaymentStatus = PaymentStatus.APPROVED;

      mockRepository.findOne.mockResolvedValue(null);

      await expect(adapter.updatePaymentStatus(orderId, newPaymentStatus)).rejects.toThrow(OrderNotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: orderId } });
    });
  });

  describe('findAllOrders', () => {
    it('should find all orders successfully', async () => {
      const mockEntities = [
        {
          id: '123',
          customerId: 'customer123',
          customerCPF: null,
          items: [{ productId: 'product123', quantity: 2 }],
          status: OrderStatus.RECEIVED,
          paymentStatus: PaymentStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '456',
          customerId: 'customer456',
          customerCPF: null,
          items: [{ productId: 'product456', quantity: 1 }],
          status: OrderStatus.IN_PREPARATION,
          paymentStatus: PaymentStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await adapter.findAllOrders();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Order);
      expect(result[1]).toBeInstanceOf(Order);
      expect(result[0].getId()).toBe('123');
      expect(result[1].getId()).toBe('456');
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOrdersByStatus', () => {
    it('should find orders by status successfully', async () => {
      const status = OrderStatus.RECEIVED;
      const mockEntities = [
        {
          id: '123',
          customerId: 'customer123',
          customerCPF: null,
          items: [{ productId: 'product123', quantity: 2 }],
          status: OrderStatus.RECEIVED,
          paymentStatus: PaymentStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await adapter.findOrdersByStatus(status);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Order);
      expect(result[0].getStatus()).toBe(status);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { status } });
    });
  });

  describe('findOrdersByCustomerId', () => {
    it('should find orders by customer id successfully', async () => {
      const customerId = 'customer123';
      const mockEntities = [
        {
          id: '123',
          customerId: customerId,
          customerCPF: null,
          items: [{ productId: 'product123', quantity: 2 }],
          status: OrderStatus.RECEIVED,
          paymentStatus: PaymentStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await adapter.findOrdersByCustomerId(customerId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Order);
      expect(result[0].getCustomerId()).toBe(customerId);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { customerId } });
    });
  });
});
