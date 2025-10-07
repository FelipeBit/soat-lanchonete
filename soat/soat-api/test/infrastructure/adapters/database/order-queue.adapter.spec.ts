import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderQueueAdapter } from '../../../../src/infrastructure/adapters/database/order-queue.adapter';
import { OrderQueueEntity } from '../../../../src/infrastructure/adapters/database/entities/order-queue.entity';
import { OrderQueue } from '../../../../src/domain/entities/order-queue.entity';
import { OrderStatus } from '../../../../src/domain/entities/order.entity';

describe('OrderQueueAdapter', () => {
  let adapter: OrderQueueAdapter;
  let repository: Repository<OrderQueueEntity>;

  const mockRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderQueueAdapter,
        {
          provide: getRepositoryToken(OrderQueueEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    adapter = module.get<OrderQueueAdapter>(OrderQueueAdapter);
    repository = module.get<Repository<OrderQueueEntity>>(
      getRepositoryToken(OrderQueueEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrderQueue', () => {
    it('should create an order queue successfully', async () => {
      const orderId = '123';
      const mockEntity = new OrderQueueEntity();
      mockEntity.id = expect.any(String);
      mockEntity.orderId = orderId;
      mockEntity.status = OrderStatus.RECEIVED;
      mockEntity.createdAt = expect.any(Date);
      mockEntity.updatedAt = expect.any(Date);

      mockRepository.save.mockResolvedValue(mockEntity);

      const result = await adapter.createOrderQueue(orderId);

      expect(result).toBeInstanceOf(OrderQueue);
      expect(result.getOrderId()).toBe(orderId);
      expect(result.getStatus()).toBe(OrderStatus.RECEIVED);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(OrderQueueEntity),
      );
    });
  });

  describe('findOrderQueueByOrderId', () => {
    it('should find an order queue by order id successfully', async () => {
      const orderId = '123';
      const mockEntity = new OrderQueueEntity();
      mockEntity.id = 'queue123';
      mockEntity.orderId = orderId;
      mockEntity.status = OrderStatus.RECEIVED;
      mockEntity.createdAt = new Date();
      mockEntity.updatedAt = new Date();

      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await adapter.findOrderQueueByOrderId(orderId);

      expect(result).toBeInstanceOf(OrderQueue);
      expect(result.getOrderId()).toBe(orderId);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { orderId },
      });
    });

    it('should return null when order queue not found', async () => {
      const orderId = '123';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await adapter.findOrderQueueByOrderId(orderId);

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { orderId },
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const orderId = '123';
      const newStatus = OrderStatus.IN_PREPARATION;
      const mockEntity = new OrderQueueEntity();
      mockEntity.id = 'queue123';
      mockEntity.orderId = orderId;
      mockEntity.status = OrderStatus.RECEIVED;
      mockEntity.createdAt = new Date();
      mockEntity.updatedAt = new Date();

      mockRepository.findOne.mockResolvedValue(mockEntity);
      mockRepository.save.mockResolvedValue({
        ...mockEntity,
        status: newStatus,
      });

      const result = await adapter.updateOrderStatus(orderId, newStatus);

      expect(result).toBeInstanceOf(OrderQueue);
      expect(result.getStatus()).toBe(newStatus);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { orderId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error when order queue not found', async () => {
      const orderId = '123';
      const newStatus = OrderStatus.IN_PREPARATION;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        adapter.updateOrderStatus(orderId, newStatus),
      ).rejects.toThrow('Order queue not found');
    });
  });

  describe('findOrderQueuesByStatus', () => {
    it('should find order queues by status successfully', async () => {
      const status = OrderStatus.RECEIVED;
      const mockEntities = [
        {
          id: 'queue123',
          orderId: '123',
          status: OrderStatus.RECEIVED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'queue456',
          orderId: '456',
          status: OrderStatus.RECEIVED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await adapter.findOrderQueuesByStatus(status);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(OrderQueue);
      expect(result[1]).toBeInstanceOf(OrderQueue);
      expect(result[0].getStatus()).toBe(status);
      expect(result[1].getStatus()).toBe(status);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { status } });
    });
  });

  describe('findAllOrderQueues', () => {
    it('should find all order queues successfully', async () => {
      const mockEntities = [
        {
          id: 'queue123',
          orderId: '123',
          status: OrderStatus.RECEIVED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'queue456',
          orderId: '456',
          status: OrderStatus.IN_PREPARATION,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await adapter.findAllOrderQueues();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(OrderQueue);
      expect(result[1]).toBeInstanceOf(OrderQueue);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });
});
