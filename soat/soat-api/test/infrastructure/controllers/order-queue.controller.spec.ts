import { Test, TestingModule } from '@nestjs/testing';
import { OrderQueueController } from '../../../src/infrastructure/controllers/order-queue.controller';
import { OrderQueueApplicationService } from '../../../src/application/services/order-queue.application.service';
import { OrderStatus } from '../../../src/domain/entities/order.entity';

describe('OrderQueueController', () => {
  let controller: OrderQueueController;
  let orderQueueApplicationService: OrderQueueApplicationService;

  const mockOrderQueueApplicationService = {
    getAllOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderQueueController],
      providers: [
        {
          provide: OrderQueueApplicationService,
          useValue: mockOrderQueueApplicationService,
        },
      ],
    }).compile();

    controller = module.get<OrderQueueController>(OrderQueueController);
    orderQueueApplicationService = module.get<OrderQueueApplicationService>(
      OrderQueueApplicationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listAllOrders', () => {
    it('should return all orders in queue successfully', async () => {
      const mockOrders = [
        {
          getId: () => 'queue-1',
          getOrderId: () => 'order-1',
          getStatus: () => OrderStatus.RECEIVED,
          getCreatedAt: () => new Date('2024-01-01T10:00:00Z'),
          getUpdatedAt: () => new Date('2024-01-01T10:00:00Z'),
        },
        {
          getId: () => 'queue-2',
          getOrderId: () => 'order-2',
          getStatus: () => OrderStatus.IN_PREPARATION,
          getCreatedAt: () => new Date('2024-01-01T10:05:00Z'),
          getUpdatedAt: () => new Date('2024-01-01T10:05:00Z'),
        },
      ];

      mockOrderQueueApplicationService.getAllOrders.mockResolvedValue(
        mockOrders,
      );

      const result = await controller.listAllOrders();

      expect(result).toEqual([
        {
          id: 'queue-1',
          orderId: 'order-1',
          status: OrderStatus.RECEIVED,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'queue-2',
          orderId: 'order-2',
          status: OrderStatus.IN_PREPARATION,
          createdAt: new Date('2024-01-01T10:05:00Z'),
          updatedAt: new Date('2024-01-01T10:05:00Z'),
        },
      ]);
      expect(mockOrderQueueApplicationService.getAllOrders).toHaveBeenCalled();
    });

    it('should return empty array when no orders in queue', async () => {
      mockOrderQueueApplicationService.getAllOrders.mockResolvedValue([]);

      const result = await controller.listAllOrders();

      expect(result).toEqual([]);
      expect(mockOrderQueueApplicationService.getAllOrders).toHaveBeenCalled();
    });
  });
});
