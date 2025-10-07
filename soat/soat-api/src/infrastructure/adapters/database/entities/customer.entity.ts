import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('customers')
export class CustomerEntity {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  cpf: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
