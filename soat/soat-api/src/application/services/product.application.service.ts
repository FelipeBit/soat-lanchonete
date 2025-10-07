import { Injectable, Inject } from '@nestjs/common';
import { Product, ProductCategory } from '../../domain/entities/product.entity';
import { ProductPort } from '../../domain/ports/product.port';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductApplicationService {
  constructor(
    @Inject('ProductPort')
    private readonly productPort: ProductPort,
  ) {}

  async createProduct(
    name: string,
    description: string,
    price: number,
    category: ProductCategory,
    imageUrl?: string,
  ): Promise<Product> {
    console.log('createProduct', name, description, price, category, imageUrl);
    const product = new Product(
      uuidv4(),
      name,
      description,
      price,
      category,
      imageUrl,
    );
    return this.productPort.createProduct(product);
  }

  async updateProduct(
    id: string,
    name: string,
    description: string,
    price: number,
    category: ProductCategory,
    imageUrl?: string,
  ): Promise<Product> {
    const product = new Product(
      id,
      name,
      description,
      price,
      category,
      imageUrl,
    );
    return this.productPort.updateProduct(product);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.productPort.deleteProduct(id);
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.productPort.findProductById(id);
  }

  async findProductsByCategory(category: ProductCategory): Promise<Product[]> {
    return this.productPort.findProductsByCategory(category);
  }
}
