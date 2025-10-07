import { OrderStatus } from './order.entity';

export class OrderQueue {
  constructor(
    private readonly id: string,
    private readonly orderId: string,
    private readonly status: OrderStatus,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getStatus(): OrderStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
