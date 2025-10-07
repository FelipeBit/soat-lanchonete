import { OrderQueue } from '../entities/order-queue.entity';
import { OrderStatus } from '../entities/order.entity';

export interface OrderQueuePort {
  createOrderQueue(orderId: string): Promise<OrderQueue>;
  findOrderQueueByOrderId(orderId: string): Promise<OrderQueue | null>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderQueue>;
  findOrderQueuesByStatus(status: OrderStatus): Promise<OrderQueue[]>;
  findAllOrderQueues(): Promise<OrderQueue[]>;
}
