export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'BRL') {
    this.amount = amount;
    this.currency = currency;
    this.validate();
  }

  private validate(): void {
    if (this.amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (typeof this.amount !== 'number' || isNaN(this.amount)) {
      throw new Error('Money amount must be a valid number');
    }
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  static zero(currency: string = 'BRL'): Money {
    return new Money(0, currency);
  }
} 