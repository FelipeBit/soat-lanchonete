import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Product,
  ProductCategory,
} from '../../../domain/entities/product.entity';
import { ProductPort } from '../../../domain/ports/product.port';
import { ProductEntity } from './entities/product.entity';
import { ProductNotFoundException } from '../../../domain/exceptions/product.exception';

@Injectable()
export class ProductAdapter implements ProductPort {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
  ) {}

  async createProduct(product: Product): Promise<Product> {
    const entity = new ProductEntity();
    entity.id = product.getId();
    entity.name = product.getName();
    entity.description = product.getDescription();
    entity.price = product.getPrice();
    entity.category = product.getCategory();
    entity.imageUrl = product.getImageUrl();

    const savedProduct = await this.repository.save(entity);
    return this.toDomain(savedProduct);
  }

  async updateProduct(product: Product): Promise<Product> {
    const entity = await this.repository.findOne({
      where: { id: product.getId() },
    });
    if (!entity) throw new Error('Product not found');

    entity.name = product.getName();
    entity.description = product.getDescription();
    entity.price = product.getPrice();
    entity.category = product.getCategory();
    entity.imageUrl = product.getImageUrl();

    await this.repository.save(entity);
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.repository.findOne({ where: { id } });
    if (!product) {
      throw new ProductNotFoundException();
    }
    return this.toDomain(product);
  }

  async findProductsByCategory(category: ProductCategory): Promise<Product[]> {
    const products = await this.repository.find({ where: { category } });
    return products.map((product) => this.toDomain(product));
  }

  private toDomain(productEntity: ProductEntity): Product {
    return new Product(
      productEntity.id,
      productEntity.name,
      productEntity.description,
      productEntity.price,
      productEntity.category,
      productEntity.imageUrl,
    );
  }
}
