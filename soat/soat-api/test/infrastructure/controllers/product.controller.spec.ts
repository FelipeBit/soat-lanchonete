import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from '../../../src/infrastructure/controllers/product.controller';
import { ProductApplicationService } from '../../../src/application/services/product.application.service';
import { ProductCategory } from '../../../src/domain/entities/product.entity';
import { BadRequestException } from '@nestjs/common';
import { Product } from '../../../src/domain/entities/product.entity';

describe('ProductController', () => {
  let controller: ProductController;
  let productApplicationService: ProductApplicationService;

  const mockProductApplicationService = {
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    findProductById: jest.fn(),
    findProductsByCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductApplicationService,
          useValue: mockProductApplicationService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productApplicationService = module.get<ProductApplicationService>(
      ProductApplicationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const createProductDto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: ProductCategory.BURGER,
      imageUrl: 'http://example.com/image.jpg',
    };

    it('should create a product successfully', async () => {
      const mockProduct = new Product(
        '123',
        createProductDto.name,
        createProductDto.description,
        createProductDto.price,
        createProductDto.category,
        createProductDto.imageUrl,
      );
      mockProductApplicationService.createProduct.mockResolvedValue(
        mockProduct,
      );

      const result = await controller.createProduct(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(mockProductApplicationService.createProduct).toHaveBeenCalledWith(
        createProductDto.name,
        createProductDto.description,
        createProductDto.price,
        createProductDto.category,
        createProductDto.imageUrl,
      );
    });

    it('should throw BadRequestException when creation fails', async () => {
      const error = new Error('Creation failed');
      mockProductApplicationService.createProduct.mockRejectedValue(error);

      await expect(controller.createProduct(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateProduct', () => {
    const updateProductDto = {
      name: 'Updated Product',
      description: 'Updated Description',
      price: 149.99,
      category: ProductCategory.BEVERAGE,
      imageUrl: 'http://example.com/updated-image.jpg',
    };

    it('should update a product successfully', async () => {
      const mockUpdatedProduct = new Product(
        '123',
        updateProductDto.name,
        updateProductDto.description,
        updateProductDto.price,
        updateProductDto.category,
        updateProductDto.imageUrl,
      );
      mockProductApplicationService.updateProduct.mockResolvedValue(
        mockUpdatedProduct,
      );

      const result = await controller.updateProduct('123', updateProductDto);

      expect(result).toEqual(mockUpdatedProduct);
      expect(mockProductApplicationService.updateProduct).toHaveBeenCalledWith(
        '123',
        updateProductDto.name,
        updateProductDto.description,
        updateProductDto.price,
        updateProductDto.category,
        updateProductDto.imageUrl,
      );
    });

    it('should throw BadRequestException when update fails', async () => {
      const error = new Error('Update failed');
      mockProductApplicationService.updateProduct.mockRejectedValue(error);

      await expect(
        controller.updateProduct('123', updateProductDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      mockProductApplicationService.deleteProduct.mockResolvedValue(undefined);

      const result = await controller.deleteProduct('123');

      expect(result).toEqual({ message: 'Product deleted successfully' });
      expect(mockProductApplicationService.deleteProduct).toHaveBeenCalledWith(
        '123',
      );
    });

    it('should throw BadRequestException when deletion fails', async () => {
      const error = new Error('Deletion failed');
      mockProductApplicationService.deleteProduct.mockRejectedValue(error);

      await expect(controller.deleteProduct('123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findProductById', () => {
    it('should find a product by id successfully', async () => {
      const mockProduct = new Product(
        '123',
        'Test Product',
        'Test Description',
        99.99,
        ProductCategory.BURGER,
        'http://example.com/image.jpg',
      );
      mockProductApplicationService.findProductById.mockResolvedValue(
        mockProduct,
      );

      const result = await controller.findProductById('123');

      expect(result).toEqual(mockProduct);
      expect(
        mockProductApplicationService.findProductById,
      ).toHaveBeenCalledWith('123');
    });

    it('should throw BadRequestException when product is not found', async () => {
      mockProductApplicationService.findProductById.mockResolvedValue(null);

      await expect(controller.findProductById('123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findProductsByCategory', () => {
    it('should find products by category successfully', async () => {
      const mockProducts = [
        new Product(
          '123',
          'Test Product',
          'Test Description',
          99.99,
          ProductCategory.BURGER,
          'http://example.com/image.jpg',
        ),
      ];
      mockProductApplicationService.findProductsByCategory.mockResolvedValue(
        mockProducts,
      );

      const result = await controller.findProductsByCategory(
        ProductCategory.BURGER,
      );

      expect(result).toEqual(mockProducts);
      expect(
        mockProductApplicationService.findProductsByCategory,
      ).toHaveBeenCalledWith(ProductCategory.BURGER);
    });

    it('should throw BadRequestException when finding products fails', async () => {
      const error = new Error('Finding products failed');
      mockProductApplicationService.findProductsByCategory.mockRejectedValue(
        error,
      );

      await expect(
        controller.findProductsByCategory(ProductCategory.BURGER),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
