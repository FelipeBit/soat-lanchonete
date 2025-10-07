import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerPort } from '../../domain/ports/customer.port';
import { v4 as uuidv4 } from 'uuid';
import {
  CustomerNotFoundException,
  DuplicateCPFException,
} from '../../domain/exceptions/customer.exception';
import { isValidCPF } from '../../domain/utils/cpf.validator';
import { formatCPF } from '../../domain/utils/cpf.formatter';
import { ERROR_MESSAGES } from '../../domain/utils/constants';

interface CustomerCreationData {
  name?: string;
  email?: string;
  cpf?: string;
}

@Injectable()
export class CustomerApplicationService {
  constructor(
    @Inject('CustomerPort')
    private readonly customerPort: CustomerPort,
  ) {}

  async createCustomerWithCPF(cpf: string): Promise<Customer> {
    const formattedCPF = this.formatAndValidateCPF(cpf);
    await this.validateCPFNotExists(formattedCPF);

    const customerData: CustomerCreationData = {
      cpf: formattedCPF,
    };

    const customer = this.createCustomerEntity(customerData);
    return this.customerPort.save(customer);
  }

  async createCustomerWithEmail(
    name: string,
    email: string,
  ): Promise<Customer> {
    await this.validateEmailNotExists(email);

    const customerData: CustomerCreationData = {
      name,
      email,
    };

    const customer = this.createCustomerEntity(customerData);
    return this.customerPort.save(customer);
  }

  async findCustomerByEmail(email: string): Promise<Customer> {
    const customer = await this.customerPort.findByEmail(email);
    if (!customer) {
      throw new CustomerNotFoundException();
    }
    return customer;
  }

  async findCustomerByCPF(cpf: string): Promise<Customer> {
    const formattedCPF = this.formatAndValidateCPF(cpf);
    const customer = await this.customerPort.findByCpf(formattedCPF);
    
    if (!customer) {
      throw new CustomerNotFoundException();
    }
    
    return customer;
  }

  private formatAndValidateCPF(cpf: string): string {
    const formattedCPF = formatCPF(cpf);
    if (!isValidCPF(formattedCPF)) {
      throw new Error(ERROR_MESSAGES.CUSTOMER.INVALID_CPF);
    }
    return formattedCPF;
  }

  private async validateCPFNotExists(cpf: string): Promise<void> {
    const existingCustomer = await this.customerPort.findByCpf(cpf);
    if (existingCustomer) {
      throw new ConflictException(ERROR_MESSAGES.CUSTOMER.CPF_ALREADY_REGISTERED);
    }
  }

  private async validateEmailNotExists(email: string): Promise<void> {
    const existingCustomer = await this.customerPort.findByEmail(email);
    if (existingCustomer) {
      throw new ConflictException(ERROR_MESSAGES.CUSTOMER.EMAIL_ALREADY_REGISTERED);
    }
  }

  private createCustomerEntity(customerData: CustomerCreationData): Customer {
    return new Customer(
      uuidv4(),
      customerData.name || null,
      customerData.cpf || null,
      customerData.email || null,
      new Date(),
      new Date(),
    );
  }
}
