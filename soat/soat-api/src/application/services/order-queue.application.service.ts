import { Injectable, Inject } from '@nestjs/common';
import { OrderQueue } from '../../domain/entities/order-queue.entity';
import { OrderQueuePort } from '../../domain/ports/order-queue.port';
import { OrderStatus } from '../../domain/entities/order.entity';

@Injectable()
export class OrderQueueApplicationService {
  constructor(
    @Inject('OrderQueuePort')
    private readonly orderQueuePort: OrderQueuePort,
  ) {}

  async addOrderToQueue(orderId: string): Promise<OrderQueue> {
    return this.orderQueuePort.createOrderQueue(orderId);
  }

  async getOrderQueue(orderId: string): Promise<OrderQueue | null> {
    return this.orderQueuePort.findOrderQueueByOrderId(orderId);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderQueue> {
    return this.orderQueuePort.updateOrderStatus(orderId, status);
  }

  async getOrdersByStatus(status: OrderStatus): Promise<OrderQueue[]> {
    return this.orderQueuePort.findOrderQueuesByStatus(status);
  }

  async getAllOrders(): Promise<OrderQueue[]> {
    return this.orderQueuePort.findAllOrderQueues();
  }
}
