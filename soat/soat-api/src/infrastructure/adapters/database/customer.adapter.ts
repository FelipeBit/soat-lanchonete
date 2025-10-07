import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerPort } from '../../../domain/ports/customer.port';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerNotFoundException } from '../../../domain/exceptions/customer.exception';
import { formatCPF } from '../../../domain/utils/cpf.formatter';

@Injectable()
export class CustomerAdapter implements CustomerPort {
  private readonly logger = new Logger(CustomerAdapter.name);

  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repository: Repository<CustomerEntity>,
  ) {}

  async save(customer: Customer): Promise<Customer> {
    const entity = this.repository.create({
      id: customer.getId(),
      name: customer.getName(),
      cpf: customer.getCPF(),
      email: customer.getEmail(),
      createdAt: customer.getCreatedAt(),
      updatedAt: customer.getUpdatedAt(),
    });

    await this.repository.save(entity);
    return customer;
  }

  async findById(id: string): Promise<Customer> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new CustomerNotFoundException();

    return new Customer(
      entity.id,
      entity.name,
      entity.cpf,
      entity.email,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const entity = await this.repository.findOne({ where: { email } });
    if (!entity) return null;

    return new Customer(
      entity.id,
      entity.name,
      entity.cpf,
      entity.email,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async findByCpf(cpf: string): Promise<Customer | null> {
    this.logger.debug(`Searching for customer with CPF: ${cpf}`);
    const formattedCPF = formatCPF(cpf);
    this.logger.debug(`Formatted CPF: ${formattedCPF}`);

    const entity = await this.repository.findOne({
      where: { cpf: formattedCPF },
    });
    this.logger.debug(`Found entity: ${entity ? 'yes' : 'no'}`);

    if (!entity) return null;

    return new Customer(
      entity.id,
      entity.name,
      entity.cpf,
      entity.email,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
