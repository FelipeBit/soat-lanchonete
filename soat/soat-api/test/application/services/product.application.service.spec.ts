import { Test, TestingModule } from '@nestjs/testing';
import { ProductApplicationService } from '../../../src/application/services/product.application.service';
import {
  Product,
  ProductCategory,
} from '../../../src/domain/entities/product.entity';
import { ProductPort } from '../../../src/domain/ports/product.port';

describe('ProductApplicationService', () => {
  let service: ProductApplicationService;
  let productPort: jest.Mocked<ProductPort>;

  const mockProductPort = {
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    findProductById: jest.fn(),
    findProductsByCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductApplicationService,
        {
          provide: 'ProductPort',
          useValue: mockProductPort,
        },
      ],
    }).compile();

    service = module.get<ProductApplicationService>(ProductApplicationService);
    productPort = module.get('ProductPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: ProductCategory.BURGER,
        imageUrl: 'http://example.com/image.jpg',
      };

      const mockProduct = new Product(
        expect.any(String),
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.imageUrl,
      );

      mockProductPort.createProduct.mockResolvedValue(mockProduct);

      const result = await service.createProduct(
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.imageUrl,
      );

      expect(result).toBeInstanceOf(Product);
      expect(result.getName()).toBe(productData.name);
      expect(result.getDescription()).toBe(productData.description);
      expect(result.getPrice()).toBe(productData.price);
      expect(result.getCategory()).toBe(productData.category);
      expect(result.getImageUrl()).toBe(productData.imageUrl);
      expect(mockProductPort.createProduct).toHaveBeenCalledWith(
        expect.any(Product),
      );
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const productId = '123';
      const productData = {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 149.99,
        category: ProductCategory.BEVERAGE,
        imageUrl: 'http://example.com/updated-image.jpg',
      };

      const mockProduct = new Product(
        productId,
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.imageUrl,
      );

      mockProductPort.updateProduct.mockResolvedValue(mockProduct);

      const result = await service.updateProduct(
        productId,
        productData.name,
        productData.description,
        productData.price,
        productData.category,
        productData.imageUrl,
      );

      expect(result).toBeInstanceOf(Product);
      expect(result.getId()).toBe(productId);
      expect(result.getName()).toBe(productData.name);
      expect(result.getDescription()).toBe(productData.description);
      expect(result.getPrice()).toBe(productData.price);
      expect(result.getCategory()).toBe(productData.category);
      expect(result.getImageUrl()).toBe(productData.imageUrl);
      expect(mockProductPort.updateProduct).toHaveBeenCalledWith(
        expect.any(Product),
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      const productId = '123';
      mockProductPort.deleteProduct.mockResolvedValue(undefined);

      await service.deleteProduct(productId);

      expect(mockProductPort.deleteProduct).toHaveBeenCalledWith(productId);
    });
  });

  describe('findProductById', () => {
    it('should find a product by id successfully', async () => {
      const productId = '123';
      const mockProduct = new Product(
        productId,
        'Test Product',
        'Test Description',
        99.99,
        ProductCategory.BURGER,
        'http://example.com/image.jpg',
      );

      mockProductPort.findProductById.mockResolvedValue(mockProduct);

      const result = await service.findProductById(productId);

      expect(result).toBeInstanceOf(Product);
      expect(result.getId()).toBe(productId);
      expect(mockProductPort.findProductById).toHaveBeenCalledWith(productId);
    });

    it('should return null when product is not found', async () => {
      const productId = '123';
      mockProductPort.findProductById.mockResolvedValue(null);

      const result = await service.findProductById(productId);

      expect(result).toBeNull();
      expect(mockProductPort.findProductById).toHaveBeenCalledWith(productId);
    });
  });

  describe('findProductsByCategory', () => {
    it('should find products by category successfully', async () => {
      const category = ProductCategory.BURGER;
      const mockProducts = [
        new Product(
          '123',
          'Burger 1',
          'Description 1',
          99.99,
          category,
          'http://example.com/image1.jpg',
        ),
        new Product(
          '456',
          'Burger 2',
          'Description 2',
          149.99,
          category,
          'http://example.com/image2.jpg',
        ),
      ];

      mockProductPort.findProductsByCategory.mockResolvedValue(mockProducts);

      const result = await service.findProductsByCategory(category);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Product);
      expect(result[1]).toBeInstanceOf(Product);
      expect(result[0].getCategory()).toBe(category);
      expect(result[1].getCategory()).toBe(category);
      expect(mockProductPort.findProductsByCategory).toHaveBeenCalledWith(
        category,
      );
    });

    it('should return empty array when no products found', async () => {
      const category = ProductCategory.BURGER;
      mockProductPort.findProductsByCategory.mockResolvedValue([]);

      const result = await service.findProductsByCategory(category);

      expect(result).toHaveLength(0);
      expect(mockProductPort.findProductsByCategory).toHaveBeenCalledWith(
        category,
      );
    });
  });
});
