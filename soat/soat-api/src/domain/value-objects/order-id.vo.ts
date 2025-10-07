import { v4 as uuidv4 } from 'uuid';

export class OrderId {
  private readonly value: string;

  constructor(value?: string) {
    this.value = value || uuidv4();
    this.validate();
  }

  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('Order ID must be a valid string');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static generate(): OrderId {
    return new OrderId();
  }
} 