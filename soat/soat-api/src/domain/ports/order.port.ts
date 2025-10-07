import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';

export interface OrderPort {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order>;
  addItemsToOrder(
    orderId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<Order>;
  removeItemFromOrder(orderId: string, productId: string): Promise<Order>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>;
  updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<Order>;
  findAllOrders(): Promise<Order[]>;
  findOrdersByStatus(status: OrderStatus): Promise<Order[]>;
  findOrdersByCustomerId(customerId: string): Promise<Order[]>;
}
