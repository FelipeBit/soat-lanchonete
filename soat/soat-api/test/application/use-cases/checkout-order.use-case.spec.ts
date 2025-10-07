import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutOrderUseCase } from '../../../src/application/use-cases/checkout-order.use-case';
import { OrderRepositoryPort } from '../../../src/domain/ports/order-repository.port';
import { CustomerPort } from '../../../src/domain/ports/customer.port';
import { ProductPort } from '../../../src/domain/ports/product.port';
import { Order, OrderStatus, PaymentStatus } from '../../../src/domain/entities/order.entity';
import { Product, ProductCategory } from '../../../src/domain/entities/product.entity';
import { Customer } from '../../../src/domain/entities/customer.entity';
import { EmptyOrderException } from '../../../src/domain/exceptions/order.exception';
import { CustomerNotFoundException } from '../../../src/domain/exceptions/customer.exception';

describe('CheckoutOrderUseCase', () => {
  let useCase: CheckoutOrderUseCase;
  let orderRepository: jest.Mocked<OrderRepositoryPort>;
  let customerPort: jest.Mocked<CustomerPort>;
  let productPort: jest.Mocked<ProductPort>;

  beforeEach(async () => {
    const mockOrderRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      findByCustomerId: jest.fn(),
      updateStatus: jest.fn(),
      updatePaymentStatus: jest.fn(),
      exists: jest.fn(),
    };

    const mockCustomerPort = {
      findById: jest.fn(),
      save: jest.fn(),
      findByEmail: jest.fn(),
      findByCPF: jest.fn(),
    };

    const mockProductPort = {
      findProductById: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutOrderUseCase,
        {
          provide: 'OrderRepositoryPort',
          useValue: mockOrderRepository,
        },
        {
          provide: 'CustomerPort',
          useValue: mockCustomerPort,
        },
        {
          provide: 'ProductPort',
          useValue: mockProductPort,
        },
      ],
    }).compile();

    useCase = module.get<CheckoutOrderUseCase>(CheckoutOrderUseCase);
    orderRepository = module.get('OrderRepositoryPort');
    customerPort = module.get('CustomerPort');
    productPort = module.get('ProductPort');
  });

  describe('execute', () => {
    const mockCustomer = new Customer(
      'customer-id', 
      'John Doe', 
      '123.456.789-00', 
      'john@example.com', 
      new Date(), 
      new Date()
    );
    const mockProduct = new Product(
      'product-id', 
      'Hamburger', 
      'Delicious hamburger', 
      15.99, 
      ProductCategory.BURGER
    );
    
    const mockOrder = new Order(
      'order-id',
      'customer-id',
      null,
      [{ productId: 'product-id', quantity: 2 }],
      OrderStatus.RECEIVED,
      PaymentStatus.PENDING,
      new Date(),
      new Date(),
    );

    it('should successfully create an order with valid data', async () => {
      // Arrange
      const request = {
        customerId: 'customer-id',
        items: [{ productId: 'product-id', quantity: 2 }],
      };

      customerPort.findById.mockResolvedValue(mockCustomer);
      productPort.findProductById.mockResolvedValue(mockProduct);
      orderRepository.save.mockResolvedValue(mockOrder);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.orderId).toBe('order-id');
      expect(result.totalAmount).toBe(31.98); // 15.99 * 2
      expect(result.status).toBe(OrderStatus.RECEIVED);
      expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        productId: 'product-id',
        quantity: 2,
        price: 15.99,
        total: 31.98,
      });
    });

    it('should create an order without customer ID', async () => {
      // Arrange
      const request = {
        customerId: null,
        items: [{ productId: 'product-id', quantity: 1 }],
      };

      productPort.findProductById.mockResolvedValue(mockProduct);
      orderRepository.save.mockResolvedValue(mockOrder);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.orderId).toBe('order-id');
      expect(result.totalAmount).toBe(15.99);
      expect(customerPort.findById).not.toHaveBeenCalled();
    });

    it('should throw EmptyOrderException when no items provided', async () => {
      // Arrange
      const request = {
        customerId: null,
        items: [],
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(EmptyOrderException);
    });

    it('should throw CustomerNotFoundException when customer not found', async () => {
      // Arrange
      const request = {
        customerId: 'invalid-customer-id',
        items: [{ productId: 'product-id', quantity: 1 }],
      };

      customerPort.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(CustomerNotFoundException);
    });

    it('should throw error when product not found', async () => {
      // Arrange
      const request = {
        customerId: null,
        items: [{ productId: 'invalid-product-id', quantity: 1 }],
      };

      productPort.findProductById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow('Product with ID invalid-product-id not found');
    });
  });
}); 