import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';

export interface OrderRepositoryPort {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order>;
  exists(id: string): Promise<boolean>;
} 