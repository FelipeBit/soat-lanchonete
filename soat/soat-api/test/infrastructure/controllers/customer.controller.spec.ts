import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from '../../../src/infrastructure/controllers/customer.controller';
import { CustomerApplicationService } from '../../../src/application/services/customer.application.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Customer } from '../../../src/domain/entities/customer.entity';

describe('CustomerController', () => {
  let controller: CustomerController;
  let customerApplicationService: CustomerApplicationService;

  const mockCustomerApplicationService = {
    createCustomerWithCPF: jest.fn(),
    createCustomerWithEmail: jest.fn(),
    findCustomerByEmail: jest.fn(),
    findCustomerByCPF: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerApplicationService,
          useValue: mockCustomerApplicationService,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    customerApplicationService = module.get<CustomerApplicationService>(
      CustomerApplicationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomerWithCPF', () => {
    const validCPF = '123.456.789-09';
    const invalidCPF = '123.456.789-00';

    it('should create a customer with valid CPF successfully', async () => {
      const mockCustomer = new Customer(
        '123',
        null,
        validCPF,
        null,
        new Date(),
        new Date(),
      );
      mockCustomerApplicationService.createCustomerWithCPF.mockResolvedValue(
        mockCustomer,
      );

      const result = await controller.createCustomerWithCPF({ cpf: validCPF });

      expect(result).toEqual(mockCustomer);
      expect(
        mockCustomerApplicationService.createCustomerWithCPF,
      ).toHaveBeenCalledWith(validCPF);
    });

    it('should throw BadRequestException when CPF is invalid', async () => {
      await expect(
        controller.createCustomerWithCPF({ cpf: invalidCPF }),
      ).rejects.toThrow(BadRequestException);
      expect(
        mockCustomerApplicationService.createCustomerWithCPF,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when CPF is already registered', async () => {
      const error = new ConflictException('CPF já cadastrado');
      mockCustomerApplicationService.createCustomerWithCPF.mockRejectedValue(
        error,
      );

      await expect(
        controller.createCustomerWithCPF({ cpf: validCPF }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when other errors occur', async () => {
      const error = new Error('Other error');
      mockCustomerApplicationService.createCustomerWithCPF.mockRejectedValue(
        error,
      );

      await expect(
        controller.createCustomerWithCPF({ cpf: validCPF }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createCustomerWithEmail', () => {
    const createCustomerDto = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should create a customer with email successfully', async () => {
      const mockCustomer = new Customer(
        '123',
        createCustomerDto.name,
        null,
        createCustomerDto.email,
        new Date(),
        new Date(),
      );
      mockCustomerApplicationService.createCustomerWithEmail.mockResolvedValue(
        mockCustomer,
      );

      const result =
        await controller.createCustomerWithEmail(createCustomerDto);

      expect(result).toEqual(mockCustomer);
      expect(
        mockCustomerApplicationService.createCustomerWithEmail,
      ).toHaveBeenCalledWith(createCustomerDto.name, createCustomerDto.email);
    });

    it('should throw ConflictException when email is already registered', async () => {
      const error = new ConflictException('Email já cadastrado');
      mockCustomerApplicationService.createCustomerWithEmail.mockRejectedValue(
        error,
      );

      await expect(
        controller.createCustomerWithEmail(createCustomerDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when other errors occur', async () => {
      const error = new Error('Other error');
      mockCustomerApplicationService.createCustomerWithEmail.mockRejectedValue(
        error,
      );

      await expect(
        controller.createCustomerWithEmail(createCustomerDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findCustomerByEmail', () => {
    const email = 'john@example.com';

    it('should find a customer by email successfully', async () => {
      const mockCustomer = new Customer(
        '123',
        'John Doe',
        null,
        email,
        new Date(),
        new Date(),
      );
      mockCustomerApplicationService.findCustomerByEmail.mockResolvedValue(
        mockCustomer,
      );

      const result = await controller.findCustomerByEmail(email);

      expect(result).toEqual(mockCustomer);
      expect(
        mockCustomerApplicationService.findCustomerByEmail,
      ).toHaveBeenCalledWith(email);
    });
  });

  describe('findCustomerByCPF', () => {
    const validCPF = '123.456.789-09';
    const invalidCPF = '123.456.789-00';

    it('should find a customer by valid CPF successfully', async () => {
      const mockCustomer = new Customer(
        '123',
        null,
        validCPF,
        null,
        new Date(),
        new Date(),
      );
      mockCustomerApplicationService.findCustomerByCPF.mockResolvedValue(
        mockCustomer,
      );

      const result = await controller.findCustomerByCPF(validCPF);

      expect(result).toEqual(mockCustomer);
      expect(
        mockCustomerApplicationService.findCustomerByCPF,
      ).toHaveBeenCalledWith(validCPF);
    });

    it('should throw BadRequestException when CPF is invalid', async () => {
      await expect(controller.findCustomerByCPF(invalidCPF)).rejects.toThrow(
        BadRequestException,
      );
      expect(
        mockCustomerApplicationService.findCustomerByCPF,
      ).not.toHaveBeenCalled();
    });
  });
});
