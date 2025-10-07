import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ProductCategory } from '../../../../domain/entities/product.entity';

@Entity('products')
export class ProductEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: ProductCategory,
  })
  category: ProductCategory;

  @Column({ nullable: true })
  imageUrl: string;
}
