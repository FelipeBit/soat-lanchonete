import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { OrderQueueApplicationService } from '../../../src/application/services/order-queue.application.service';
import { OrderQueuePort } from '../../../src/domain/ports/order-queue.port';
import { OrderQueue } from '../../../src/domain/entities/order-queue.entity';
import { OrderStatus } from '../../../src/domain/entities/order.entity';

describe('OrderQueueApplicationService', () => {
  let service: OrderQueueApplicationService;
  let orderQueuePort: jest.Mocked<OrderQueuePort>;

  const mockOrderQueuePort = {
    createOrderQueue: jest.fn(),
    findOrderQueueByOrderId: jest.fn(),
    updateOrderStatus: jest.fn(),
    findOrderQueuesByStatus: jest.fn(),
    findAllOrderQueues: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderQueueApplicationService,
        {
          provide: 'OrderQueuePort',
          useValue: mockOrderQueuePort,
        },
      ],
    }).compile();

    service = module.get<OrderQueueApplicationService>(
      OrderQueueApplicationService,
    );
    orderQueuePort = module.get(
      'OrderQueuePort',
    ) as jest.Mocked<OrderQueuePort>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addOrderToQueue', () => {
    it('should add an order to queue successfully', async () => {
      const orderId = '123';
      const mockOrderQueue = new OrderQueue(
        expect.any(String),
        orderId,
        OrderStatus.RECEIVED,
        expect.any(Date),
        expect.any(Date),
      );

      mockOrderQueuePort.createOrderQueue.mockResolvedValue(mockOrderQueue);

      const result = await service.addOrderToQueue(orderId);

      expect(result).toBeInstanceOf(OrderQueue);
      expect(result.getOrderId()).toBe(orderId);
      expect(result.getStatus()).toBe(OrderStatus.RECEIVED);
      expect(mockOrderQueuePort.createOrderQueue).toHaveBeenCalledWith(orderId);
    });
  });

  describe('getOrderQueue', () => {
    it('should get an order queue successfully', async () => {
      const orderId = '123';
      const mockOrderQueue = new OrderQueue(
        expect.any(String),
        orderId,
        OrderStatus.RECEIVED,
        expect.any(Date),
        expect.any(Date),
      );

      mockOrderQueuePort.findOrderQueueByOrderId.mockResolvedValue(
        mockOrderQueue,
      );

      const result = await service.getOrderQueue(orderId);

      expect(result).toBeInstanceOf(OrderQueue);
      expect(result.getOrderId()).toBe(orderId);
      expect(mockOrderQueuePort.findOrderQueueByOrderId).toHaveBeenCalledWith(
        orderId,
      );
    });

    it('should return null when order queue is not found', async () => {
      const orderId = '123';
      mockOrderQueuePort.findOrderQueueByOrderId.mockResolvedValue(null);

      const result = await service.getOrderQueue(orderId);

      expect(result).toBeNull();
      expect(mockOrderQueuePort.findOrderQueueByOrderId).toHaveBeenCalledWith(
        orderId,
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const orderId = '123';
      const newStatus = OrderStatus.READY;
      const mockOrderQueue = new OrderQueue(
        expect.any(String),
        orderId,
        newStatus,
        expect.any(Date),
        expect.any(Date),
      );

      mockOrderQueuePort.updateOrderStatus.mockResolvedValue(mockOrderQueue);

      const result = await service.updateOrderStatus(orderId, newStatus);

      expect(result).toBeInstanceOf(OrderQueue);
      expect(result.getOrderId()).toBe(orderId);
      expect(result.getStatus()).toBe(newStatus);
      expect(mockOrderQueuePort.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        newStatus,
      );
    });
  });

  describe('getOrdersByStatus', () => {
    it('should get orders by status successfully', async () => {
      const status = OrderStatus.RECEIVED;
      const mockOrderQueues = [
        new OrderQueue(
          expect.any(String),
          '123',
          status,
          expect.any(Date),
          expect.any(Date),
        ),
        new OrderQueue(
          expect.any(String),
          '456',
          status,
          expect.any(Date),
          expect.any(Date),
        ),
      ];

      mockOrderQueuePort.findOrderQueuesByStatus.mockResolvedValue(
        mockOrderQueues,
      );

      const result = await service.getOrdersByStatus(status);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(OrderQueue);
      expect(result[1]).toBeInstanceOf(OrderQueue);
      expect(result[0].getStatus()).toBe(status);
      expect(result[1].getStatus()).toBe(status);
      expect(mockOrderQueuePort.findOrderQueuesByStatus).toHaveBeenCalledWith(
        status,
      );
    });
  });

  describe('getAllOrders', () => {
    it('should get all orders successfully', async () => {
      const mockOrderQueues = [
        new OrderQueue(
          expect.any(String),
          '123',
          OrderStatus.RECEIVED,
          expect.any(Date),
          expect.any(Date),
        ),
        new OrderQueue(
          expect.any(String),
          '456',
          OrderStatus.READY,
          expect.any(Date),
          expect.any(Date),
        ),
      ];

      mockOrderQueuePort.findAllOrderQueues.mockResolvedValue(mockOrderQueues);

      const result = await service.getAllOrders();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(OrderQueue);
      expect(result[1]).toBeInstanceOf(OrderQueue);
      expect(mockOrderQueuePort.findAllOrderQueues).toHaveBeenCalled();
    });
  });
});
