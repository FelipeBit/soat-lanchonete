import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomerNotFoundException extends HttpException {
  constructor() {
    super('Customer not found', HttpStatus.NOT_FOUND);
  }
}

export class DuplicateEmailException extends Error {
  constructor() {
    super('Email already registered');
  }
}

export class DuplicateCPFException extends Error {
  constructor() {
    super('CPF já cadastrado');
  }
}
