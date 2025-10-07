import { OrderStatus, PaymentStatus } from '../entities/order.entity';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface ValidatedOrderItem extends OrderItem {
  price: number;
  total: number;
}

export interface OrderItemWithDetails extends ValidatedOrderItem {
  productName: string;
  productDescription: string;
}

export interface CheckoutResult {
  order: OrderDto;
  totalAmount: number;
  items: ValidatedOrderItem[];
}

export interface OrderDto {
  id: string;
  customerId: string | null;
  customerCPF: string | null;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithDetails {
  order: OrderDto;
  items: OrderItemWithDetails[];
  totalAmount: number;
}

export interface PaymentStatusResult {
  orderId: string;
  paymentStatus: PaymentStatus;
  isApproved: boolean;
} 