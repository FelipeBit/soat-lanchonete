import { Injectable, Inject } from '@nestjs/common';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { Order, OrderStatus } from '../../domain/entities/order.entity';
import { OrderNotFoundException } from '../../domain/exceptions/order.exception';

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
}

export interface UpdateOrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  updatedAt: Date;
}

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    // Validate order exists
    const existingOrder = await this.orderRepository.findById(request.orderId);
    if (!existingOrder) {
      throw new OrderNotFoundException();
    }

    // Update order status
    const updatedOrder = await this.orderRepository.updateStatus(
      request.orderId,
      request.status,
    );

    return {
      orderId: updatedOrder.getId(),
      status: updatedOrder.getStatus(),
      updatedAt: updatedOrder.getUpdatedAt(),
    };
  }
} 