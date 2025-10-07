import { Product, ProductCategory } from '../entities/product.entity';

export interface ProductPort {
  createProduct(product: Product): Promise<Product>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  findProductById(id: string): Promise<Product | null>;
  findProductsByCategory(category: ProductCategory): Promise<Product[]>;
}
