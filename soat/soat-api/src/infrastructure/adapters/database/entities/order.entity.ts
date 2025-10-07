import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus, PaymentStatus } from '../../../../domain/entities/order.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  customerId: string | null;

  @Column({ nullable: true })
  customerCPF: string | null;

  @Column('json')
  items: Array<{ productId: string; quantity: number }>;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
