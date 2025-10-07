import { Injectable, Inject } from '@nestjs/common';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { CustomerPort } from '../../domain/ports/customer.port';
import { ProductPort } from '../../domain/ports/product.port';
import { Order, OrderStatus, PaymentStatus } from '../../domain/entities/order.entity';
import { OrderId } from '../../domain/value-objects/order-id.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { 
  OrderItem, 
  ValidatedOrderItem, 
  CheckoutResult 
} from '../../domain/types/order.types';
import { 
  EmptyOrderException,
  OrderNotFoundException 
} from '../../domain/exceptions/order.exception';
import { CustomerNotFoundException } from '../../domain/exceptions/customer.exception';
import { APPLICATION_CONSTANTS } from '../../domain/utils/constants';

export interface CheckoutOrderRequest {
  customerId: string | null;
  items: OrderItem[];
}

export interface CheckoutOrderResponse {
  orderId: string;
  totalAmount: number;
  items: ValidatedOrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

@Injectable()
export class CheckoutOrderUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
    @Inject('CustomerPort')
    private readonly customerPort: CustomerPort,
    @Inject('ProductPort')
    private readonly productPort: ProductPort,
  ) {}

  async execute(request: CheckoutOrderRequest): Promise<CheckoutOrderResponse> {
    // Validate input
    this.validateOrderItems(request.items);
    await this.validateCustomerIfProvided(request.customerId);
    
    // Validate and calculate items
    const validatedItems = await this.validateAndCalculateItems(request.items);
    const totalAmount = this.calculateTotalAmount(validatedItems);
    
    // Create order
    const orderId = OrderId.generate();
    const order = this.createOrder(orderId, request.customerId, request.items);
    
    // Save order
    const savedOrder = await this.orderRepository.save(order);
    
    return {
      orderId: savedOrder.getId(),
      totalAmount,
      items: validatedItems,
      status: savedOrder.getStatus(),
      paymentStatus: savedOrder.getPaymentStatus(),
    };
  }

  private validateOrderItems(items: OrderItem[]): void {
    if (items.length < APPLICATION_CONSTANTS.VALIDATION.MIN_ORDER_ITEMS) {
      throw new EmptyOrderException();
    }
  }

  private async validateCustomerIfProvided(customerId: string | null): Promise<void> {
    if (!customerId) return;

    const customer = await this.customerPort.findById(customerId);
    if (!customer) {
      throw new CustomerNotFoundException();
    }
  }

  private async validateAndCalculateItems(items: OrderItem[]): Promise<ValidatedOrderItem[]> {
    const validatedItems: ValidatedOrderItem[] = [];

    for (const item of items) {
      const product = await this.productPort.findProductById(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      const itemTotal = product.getPrice() * item.quantity;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.getPrice(),
        total: itemTotal,
      });
    }

    return validatedItems;
  }

  private calculateTotalAmount(validatedItems: ValidatedOrderItem[]): number {
    return validatedItems.reduce((total, item) => total + item.total, 0);
  }

  private createOrder(orderId: OrderId, customerId: string | null, items: OrderItem[]): Order {
    return new Order(
      orderId.getValue(),
      customerId,
      null, // customerCPF
      items,
      OrderStatus.RECEIVED,
      PaymentStatus.PENDING,
      new Date(),
      new Date(),
    );
  }
} 