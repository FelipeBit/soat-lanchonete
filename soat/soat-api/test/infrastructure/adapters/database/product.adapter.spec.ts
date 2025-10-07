import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAdapter } from '../../../../src/infrastructure/adapters/database/product.adapter';
import { ProductEntity } from '../../../../src/infrastructure/adapters/database/entities/product.entity';
import {
  Product,
  ProductCategory,
} from '../../../../src/domain/entities/product.entity';
import { ProductNotFoundException } from '../../../../src/domain/exceptions/product.exception';

describe('ProductAdapter', () => {
  let adapter: ProductAdapter;
  let repository: Repository<ProductEntity>;

  const mockRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductAdapter,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    adapter = module.get<ProductAdapter>(ProductAdapter);
    repository = module.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const product = new Product(
        '123',
        'Test Product',
        'Test Description',
        10.99,
        ProductCategory.BURGER,
        'http://example.com/image.jpg',
      );

      const mockEntity = new ProductEntity();
      mockEntity.id = product.getId();
      mockEntity.name = product.getName();
      mockEntity.description = product.getDescription();
      mockEntity.price = product.getPrice();
      mockEntity.category = product.getCategory();
      mockEntity.imageUrl = product.getImageUrl();

      mockRepository.save.mockResolvedValue(mockEntity);

      const result = await adapter.createProduct(product);

      expect(result).toEqual(product);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(ProductEntity),
      );
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const product = new Product(
        '123',
        'Updated Product',
        'Updated Description',
        15.99,
        ProductCategory.BURGER,
        'http://example.com/updated.jpg',
      );

      const mockEntity = new ProductEntity();
      mockEntity.id = product.getId();
      mockEntity.name = product.getName();
      mockEntity.description = product.getDescription();
      mockEntity.price = product.getPrice();
      mockEntity.category = product.getCategory();
      mockEntity.imageUrl = product.getImageUrl();

      mockRepository.findOne.mockResolvedValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockEntity);

      const result = await adapter.updateProduct(product);

      expect(result).toEqual(product);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: product.getId() },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntity);
    });

    it('should throw error when product not found', async () => {
      const product = new Product(
        '123',
        'Test Product',
        'Test Description',
        10.99,
        ProductCategory.BURGER,
        'http://example.com/image.jpg',
      );

      mockRepository.findOne.mockResolvedValue(null);

      await expect(adapter.updateProduct(product)).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      const productId = '123';
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await adapter.deleteProduct(productId);

      expect(mockRepository.delete).toHaveBeenCalledWith(productId);
    });
  });

  describe('findProductById', () => {
    it('should find a product by id successfully', async () => {
      const productId = '123';
      const mockEntity = new ProductEntity();
      mockEntity.id = productId;
      mockEntity.name = 'Test Product';
      mockEntity.description = 'Test Description';
      mockEntity.price = 10.99;
      mockEntity.category = ProductCategory.BURGER;
      mockEntity.imageUrl = 'http://example.com/image.jpg';

      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await adapter.findProductById(productId);

      expect(result).toBeInstanceOf(Product);
      expect(result.getId()).toBe(productId);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });

    it('should throw ProductNotFoundException when product not found', async () => {
      const productId = '123';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(adapter.findProductById(productId)).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });

  describe('findProductsByCategory', () => {
    it('should find products by category successfully', async () => {
      const category = ProductCategory.BURGER;
      const mockEntities = [
        {
          id: '123',
          name: 'Burger 1',
          description: 'Description 1',
          price: 10.99,
          category: ProductCategory.BURGER,
          imageUrl: 'http://example.com/image1.jpg',
        },
        {
          id: '456',
          name: 'Burger 2',
          description: 'Description 2',
          price: 15.99,
          category: ProductCategory.BURGER,
          imageUrl: 'http://example.com/image2.jpg',
        },
      ];

      mockRepository.find.mockResolvedValue(mockEntities);

      const result = await adapter.findProductsByCategory(category);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Product);
      expect(result[1]).toBeInstanceOf(Product);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { category } });
    });

    it('should return empty array when no products found', async () => {
      const category = ProductCategory.BURGER;
      mockRepository.find.mockResolvedValue([]);

      const result = await adapter.findProductsByCategory(category);

      expect(result).toHaveLength(0);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { category } });
    });
  });
});
