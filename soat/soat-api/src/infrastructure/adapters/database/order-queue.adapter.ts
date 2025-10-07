import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderQueue } from '../../../domain/entities/order-queue.entity';
import { OrderQueuePort } from '../../../domain/ports/order-queue.port';
import { OrderQueueEntity } from './entities/order-queue.entity';
import { OrderStatus } from '../../../domain/entities/order.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderQueueAdapter implements OrderQueuePort {
  constructor(
    @InjectRepository(OrderQueueEntity)
    private readonly repository: Repository<OrderQueueEntity>,
  ) {}

  async createOrderQueue(orderId: string): Promise<OrderQueue> {
    const entity = new OrderQueueEntity();
    entity.id = uuidv4();
    entity.orderId = orderId;
    entity.status = OrderStatus.RECEIVED;

    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findOrderQueueByOrderId(orderId: string): Promise<OrderQueue | null> {
    const entity = await this.repository.findOne({
      where: { orderId },
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderQueue> {
    const entity = await this.repository.findOne({
      where: { orderId },
    });

    if (!entity) {
      throw new Error('Order queue not found');
    }

    entity.status = status;
    const updatedEntity = await this.repository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async findOrderQueuesByStatus(status: OrderStatus): Promise<OrderQueue[]> {
    const entities = await this.repository.find({
      where: { status },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllOrderQueues(): Promise<OrderQueue[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => this.toDomain(entity));
  }

  private toDomain(entity: OrderQueueEntity): OrderQueue {
    return new OrderQueue(
      entity.id,
      entity.orderId,
      entity.status,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
