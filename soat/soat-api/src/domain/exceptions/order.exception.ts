import { HttpException, HttpStatus } from '@nestjs/common';

export class OrderException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class OrderNotFoundException extends OrderException {
  constructor() {
    super('Order not found', HttpStatus.NOT_FOUND);
  }
}

export class EmptyOrderException extends OrderException {
  constructor() {
    super('Cannot complete order without items', HttpStatus.BAD_REQUEST);
  }
}

export class InvalidOrderStatusException extends Error {
  constructor(message: string = 'Invalid order status') {
    super(message);
    this.name = 'InvalidOrderStatusException';
  }
}
