import { Injectable, Inject } from '@nestjs/common';
import { OrderPort } from '../../domain/ports/order.port';
import { Order, OrderStatus, PaymentStatus } from '../../domain/entities/order.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  OrderNotFoundException,
  EmptyOrderException,
} from '../../domain/exceptions/order.exception';
import { OrderQueueApplicationService } from './order-queue.application.service';
import { CustomerPort } from '../../domain/ports/customer.port';
import { ProductPort } from '../../domain/ports/product.port';
import { CustomerNotFoundException } from '../../domain/exceptions/customer.exception';
import { APPLICATION_CONSTANTS, ERROR_MESSAGES } from '../../domain/utils/constants';
import { 
  OrderItem, 
  ValidatedOrderItem, 
  CheckoutResult, 
  OrderDto,
  OrderWithDetails,
  PaymentStatusResult 
} from '../../domain/types/order.types';

@Injectable()
export class OrderApplicationService {
  constructor(
    @Inject('OrderPort')
    private readonly orderPort: OrderPort,
    @Inject('CustomerPort')
    private readonly customerPort: CustomerPort,
    @Inject('ProductPort')
    private readonly productPort: ProductPort,
    private readonly orderQueueApplicationService: OrderQueueApplicationService,
  ) {}

  async checkout(
    customerId: string | null,
    orderItems: OrderItem[],
  ): Promise<CheckoutResult> {
    this.validateOrderItems(orderItems);
    await this.validateCustomerIfProvided(customerId);
    
    const validatedItems = await this.validateAndCalculateItems(orderItems);
    const totalAmount = this.calculateTotalAmount(validatedItems);
    
    const order = this.createNewOrder(customerId, orderItems);
    await this.simulatePaymentProcessing();
    
    const savedOrder = await this.orderPort.save(order);
    await this.orderQueueApplicationService.addOrderToQueue(savedOrder.getId());

    const orderDto = this.mapOrderToDto(savedOrder);

    return {
      order: orderDto,
      totalAmount,
      items: validatedItems,
    };
  }

  private validateOrderItems(orderItems: OrderItem[]): void {
    if (orderItems.length < APPLICATION_CONSTANTS.VALIDATION.MIN_ORDER_ITEMS) {
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

  private async validateAndCalculateItems(orderItems: OrderItem[]): Promise<ValidatedOrderItem[]> {
    const validatedItems: ValidatedOrderItem[] = [];

    for (const item of orderItems) {
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

  private createNewOrder(customerId: string | null, items: OrderItem[]): Order {
    return new Order(
      uuidv4(),
      customerId,
      null,
      items,
      OrderStatus.RECEIVED,
      PaymentStatus.PENDING,
      new Date(),
      new Date(),
    );
  }

  private async simulatePaymentProcessing(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, APPLICATION_CONSTANTS.PAYMENT.PROCESSING_DELAY_MS));
  }

  private mapOrderToDto(order: Order): OrderDto {
    return {
      id: order.getId(),
      customerId: order.getCustomerId(),
      customerCPF: order.getCustomerCPF(),
      items: order.getItems(),
      status: order.getStatus(),
      paymentStatus: order.getPaymentStatus(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt(),
    };
  }

  async getPaymentStatus(orderId: string): Promise<PaymentStatusResult> {
    const order = await this.orderPort.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException();
    }

    return {
      orderId: order.getId(),
      paymentStatus: order.getPaymentStatus(),
      isApproved: order.getPaymentStatus() === PaymentStatus.APPROVED,
    };
  }

  async updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus): Promise<Order> {
    const order = await this.orderPort.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException();
    }

    order.updatePaymentStatus(paymentStatus);
    return this.orderPort.updatePaymentStatus(orderId, paymentStatus);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.orderPort.findById(orderId);
    if (!order) {
      throw new OrderNotFoundException();
    }

    // Regras de fluxo:
    // 1. Só pode mudar para IN_PREPARATION se pagamento estiver APPROVED
    if (
      status === OrderStatus.IN_PREPARATION &&
      order.getPaymentStatus() !== PaymentStatus.APPROVED
    ) {
      throw new Error('O pagamento deve estar aprovado para iniciar a preparação do pedido.');
    }

    // 2. Não permitir pular etapas (ex: RECEIVED -> READY)
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.RECEIVED]: [OrderStatus.IN_PREPARATION],
      [OrderStatus.IN_PREPARATION]: [OrderStatus.READY],
      [OrderStatus.READY]: [OrderStatus.FINISHED],
      [OrderStatus.FINISHED]: [],
      [OrderStatus.CANCELLED]: [],
    };
    if (!validTransitions[order.getStatus()].includes(status)) {
      throw new Error(
        `Transição de status inválida: ${order.getStatus()} -> ${status}`,
      );
    }

    return this.orderPort.updateOrderStatus(orderId, status);
  }

  async findAllOrders(): Promise<Order[]> {
    return this.orderPort.findAllOrders();
  }

  async findOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderPort.findOrdersByStatus(status);
  }

  async findOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return this.orderPort.findOrdersByCustomerId(customerId);
  }

  async findOrderById(id: string): Promise<Order> {
    const order = await this.orderPort.findById(id);
    if (!order) {
      throw new OrderNotFoundException();
    }
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return await this.orderPort.findById(id);
  }

  async findActiveOrdersWithDetails(): Promise<OrderWithDetails[]> {
    // Buscar todos os pedidos
    const allOrders = await this.orderPort.findAllOrders();
    
    // Filtrar pedidos que não estão finalizados
    const activeOrders = allOrders.filter(order => order.getStatus() !== OrderStatus.FINISHED);
    
    // Ordenar pedidos conforme as regras especificadas
    const sortedOrders = this.sortOrdersByPriority(activeOrders);
    
    // Buscar detalhes dos produtos para cada pedido
    const ordersWithDetails = await Promise.all(
      sortedOrders.map(async (order) => {
        const itemsWithDetails = await Promise.all(
          order.getItems().map(async (item) => {
            const product = await this.productPort.findProductById(item.productId);
            if (!product) {
              throw new Error(`Product with ID ${item.productId} not found`);
            }
            
            return {
              productId: item.productId,
              quantity: item.quantity,
              productName: product.getName(),
              productDescription: product.getDescription(),
              price: product.getPrice(),
              total: product.getPrice() * item.quantity,
            };
          })
        );
        
        const totalAmount = itemsWithDetails.reduce((sum, item) => sum + item.total, 0);
        
        return {
          order: this.mapOrderToDto(order),
          items: itemsWithDetails,
          totalAmount,
        };
      })
    );
    
    return ordersWithDetails;
  }

  private sortOrdersByPriority(orders: Order[]): Order[] {
    // Definir prioridade dos status (maior número = maior prioridade)
    const statusPriority = {
      [OrderStatus.READY]: 3,
      [OrderStatus.IN_PREPARATION]: 2,
      [OrderStatus.RECEIVED]: 1,
    };

    return orders.sort((a, b) => {
      // 1. Ordenar por prioridade do status (Pronto > Em Preparação > Recebido)
      const priorityA = statusPriority[a.getStatus()] || 0;
      const priorityB = statusPriority[b.getStatus()] || 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Ordem decrescente (maior prioridade primeiro)
      }
      
      // 2. Se mesmo status, ordenar por data (mais antigo primeiro)
      const dateA = a.getCreatedAt().getTime();
      const dateB = b.getCreatedAt().getTime();
      
      return dateA - dateB; // Ordem crescente (mais antigo primeiro)
    });
  }
}
