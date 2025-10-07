export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export class Order {
  constructor(
    private readonly id: string,
    private readonly customerId: string | null,
    private readonly customerCPF: string | null,
    private readonly items: OrderItem[],
    private status: OrderStatus,
    private paymentStatus: PaymentStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    this.validateOrder();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getCustomerId(): string | null {
    return this.customerId;
  }

  getCustomerCPF(): string | null {
    return this.customerCPF;
  }

  getItems(): OrderItem[] {
    return [...this.items]; // Return a copy to prevent external modification
  }

  getStatus(): OrderStatus {
    return this.status;
  }

  getPaymentStatus(): PaymentStatus {
    return this.paymentStatus;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt); // Return a copy
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt); // Return a copy
  }

  // Business logic methods
  canTransitionTo(newStatus: OrderStatus): boolean {
    const validTransitions = this.getValidStatusTransitions();
    return validTransitions.includes(newStatus);
  }

  canUpdatePaymentStatus(newPaymentStatus: PaymentStatus): boolean {
    const validPaymentTransitions = this.getValidPaymentStatusTransitions();
    return validPaymentTransitions.includes(newPaymentStatus);
  }

  isActive(): boolean {
    return this.status !== OrderStatus.FINISHED;
  }

  isReadyForPickup(): boolean {
    return this.status === OrderStatus.READY;
  }

  isPaymentApproved(): boolean {
    return this.paymentStatus === PaymentStatus.APPROVED;
  }

  // State update methods
  updateStatus(newStatus: OrderStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    this.status = newStatus;
    this.updatedAt = new Date();
  }

  updatePaymentStatus(newPaymentStatus: PaymentStatus): void {
    if (!this.canUpdatePaymentStatus(newPaymentStatus)) {
      throw new Error(
        `Invalid payment status transition from ${this.paymentStatus} to ${newPaymentStatus}`,
      );
    }

    this.paymentStatus = newPaymentStatus;
    this.updatedAt = new Date();
  }

  // Private validation methods
  private validateOrder(): void {
    if (!this.id) {
      throw new Error('Order ID is required');
    }

    if (!this.items || this.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    if (!this.createdAt) {
      throw new Error('Order creation date is required');
    }
  }

  private getValidStatusTransitions(): OrderStatus[] {
    const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.RECEIVED]: [
        OrderStatus.IN_PREPARATION,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.IN_PREPARATION]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.FINISHED, OrderStatus.CANCELLED],
      [OrderStatus.FINISHED]: [], // No further transitions allowed
      [OrderStatus.CANCELLED]: [], // No further transitions allowed
    };

    return statusTransitions[this.status] || [];
  }

  private getValidPaymentStatusTransitions(): PaymentStatus[] {
    const paymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [
        PaymentStatus.APPROVED,
        PaymentStatus.REJECTED,
        PaymentStatus.CANCELLED,
      ],
      [PaymentStatus.APPROVED]: [PaymentStatus.CANCELLED],
      [PaymentStatus.REJECTED]: [
        PaymentStatus.PENDING,
        PaymentStatus.CANCELLED,
      ],
      [PaymentStatus.CANCELLED]: [], // No further transitions allowed
    };

    return paymentTransitions[this.paymentStatus] || [];
  }
}
