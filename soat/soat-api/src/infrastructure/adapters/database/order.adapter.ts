import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../../../domain/entities/order.entity';
import { OrderPort } from '../../../domain/ports/order.port';
import { OrderRepositoryPort } from '../../../domain/ports/order-repository.port';
import { OrderEntity } from './entities/order.entity';
import { OrderNotFoundException } from '../../../domain/exceptions/order.exception';

@Injectable()
export class OrderAdapter implements OrderPort, OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async save(order: Order): Promise<Order> {
    const entity = this.repository.create({
      id: order.getId(),
      customerId: order.getCustomerId(),
      customerCPF: order.getCustomerCPF(),
      items: order.getItems(),
      status: order.getStatus(),
      paymentStatus: order.getPaymentStatus(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt(),
    });

    await this.repository.save(entity);
    return order;
  }

  async findById(id: string): Promise<Order> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new OrderNotFoundException();

    return new Order(
      entity.id,
      entity.customerId,
      entity.customerCPF,
      entity.items,
      entity.status,
      entity.paymentStatus,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async addItemsToOrder(
    orderId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<Order> {
    const entity = await this.repository.findOne({ where: { id: orderId } });
    if (!entity) throw new OrderNotFoundException();

    entity.items = [...entity.items, ...items];
    entity.updatedAt = new Date();

    await this.repository.save(entity);

    return new Order(
      entity.id,
      entity.customerId,
      entity.customerCPF,
      entity.items,
      entity.status,
      entity.paymentStatus,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async removeItemFromOrder(
    orderId: string,
    productId: string,
  ): Promise<Order> {
    const entity = await this.repository.findOne({ where: { id: orderId } });
    if (!entity) throw new OrderNotFoundException();

    entity.items = entity.items.filter((item) => item.productId !== productId);
    entity.updatedAt = new Date();

    await this.repository.save(entity);

    return new Order(
      entity.id,
      entity.customerId,
      entity.customerCPF,
      entity.items,
      entity.status,
      entity.paymentStatus,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new OrderNotFoundException();

    entity.status = status;
    entity.updatedAt = new Date();

    await this.repository.save(entity);

    return new Order(
      entity.id,
      entity.customerId,
      entity.customerCPF,
      entity.items,
      entity.status,
      entity.paymentStatus,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new OrderNotFoundException();

    entity.paymentStatus = paymentStatus;
    entity.updatedAt = new Date();

    await this.repository.save(entity);

    return new Order(
      entity.id,
      entity.customerId,
      entity.customerCPF,
      entity.items,
      entity.status,
      entity.paymentStatus,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async findAllOrders(): Promise<Order[]> {
    const entities = await this.repository.find();
    return entities.map(
      (entity) =>
        new Order(
          entity.id,
          entity.customerId,
          entity.customerCPF,
          entity.items,
          entity.status,
          entity.paymentStatus,
          entity.createdAt,
          entity.updatedAt,
        ),
    );
  }

  async findOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const entities = await this.repository.find({ where: { status } });
    return entities.map(
      (entity) =>
        new Order(
          entity.id,
          entity.customerId,
          entity.customerCPF,
          entity.items,
          entity.status,
          entity.paymentStatus,
          entity.createdAt,
          entity.updatedAt,
        ),
    );
  }

  async findOrdersByCustomerId(customerId: string): Promise<Order[]> {
    const entities = await this.repository.find({ where: { customerId } });
    return entities.map(
      (entity) =>
        new Order(
          entity.id,
          entity.customerId,
          entity.customerCPF,
          entity.items,
          entity.status,
          entity.paymentStatus,
          entity.createdAt,
          entity.updatedAt,
        ),
    );
  }

  // OrderRepositoryPort methods
  async findAll(): Promise<Order[]> {
    return this.findAllOrders();
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.findOrdersByStatus(status);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.findOrdersByCustomerId(customerId);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.updateOrderStatus(id, status);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
