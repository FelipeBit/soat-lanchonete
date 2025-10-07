import { Customer } from '../entities/customer.entity';

export interface CustomerPort {
  save(customer: Customer): Promise<Customer>;
  findById(id: string): Promise<Customer>;
  findByEmail(email: string): Promise<Customer>;
  findByCpf(cpf: string): Promise<Customer>;
}
