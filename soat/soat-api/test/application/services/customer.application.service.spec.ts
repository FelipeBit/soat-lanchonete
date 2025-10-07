import { Test, TestingModule } from '@nestjs/testing';
import { CustomerApplicationService } from '../../../src/application/services/customer.application.service';
import { Customer } from '../../../src/domain/entities/customer.entity';
import { CustomerPort } from '../../../src/domain/ports/customer.port';
import { ConflictException } from '@nestjs/common';
import { CustomerNotFoundException } from '../../../src/domain/exceptions/customer.exception';

describe('CustomerApplicationService', () => {
  let service: CustomerApplicationService;
  let customerPort: jest.Mocked<CustomerPort>;

  const mockCustomerPort = {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findByCpf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerApplicationService,
        {
          provide: 'CustomerPort',
          useValue: mockCustomerPort,
        },
      ],
    }).compile();

    service = module.get<CustomerApplicationService>(
      CustomerApplicationService,
    );
    customerPort = module.get('CustomerPort');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomerWithCPF', () => {
    it('should create a customer with CPF successfully', async () => {
      const cpf = '12345678909';
      const mockCustomer = new Customer(
        expect.any(String),
        null,
        cpf,
        null,
        expect.any(Date),
        expect.any(Date),
      );

      mockCustomerPort.findByCpf.mockResolvedValue(null);
      mockCustomerPort.save.mockResolvedValue(mockCustomer);

      const result = await service.createCustomerWithCPF(cpf);

      expect(result).toBeInstanceOf(Customer);
      expect(result.getCPF()).toBe(cpf);
      expect(result.getName()).toBeNull();
      expect(result.getEmail()).toBeNull();
      expect(mockCustomerPort.findByCpf).toHaveBeenCalledWith(cpf);
      expect(mockCustomerPort.save).toHaveBeenCalledWith(expect.any(Customer));
    });

    it('should throw ConflictException when CPF is already registered', async () => {
      const cpf = '12345678909';
      const existingCustomer = new Customer(
        '123',
        null,
        cpf,
        null,
        new Date(),
        new Date(),
      );

      mockCustomerPort.findByCpf.mockResolvedValue(existingCustomer);

      await expect(service.createCustomerWithCPF(cpf)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCustomerPort.findByCpf).toHaveBeenCalledWith(cpf);
      expect(mockCustomerPort.save).not.toHaveBeenCalled();
    });

    it('should throw Error when CPF is invalid', async () => {
      const invalidCpf = '12345678900';

      await expect(service.createCustomerWithCPF(invalidCpf)).rejects.toThrow(
        'Invalid CPF',
      );
      expect(mockCustomerPort.findByCpf).not.toHaveBeenCalled();
      expect(mockCustomerPort.save).not.toHaveBeenCalled();
    });
  });

  describe('createCustomerWithEmail', () => {
    it('should create a customer with email successfully', async () => {
      const name = 'John Doe';
      const email = 'john@example.com';
      const mockCustomer = new Customer(
        expect.any(String),
        name,
        null,
        email,
        expect.any(Date),
        expect.any(Date),
      );

      mockCustomerPort.findByEmail.mockResolvedValue(null);
      mockCustomerPort.save.mockResolvedValue(mockCustomer);

      const result = await service.createCustomerWithEmail(name, email);

      expect(result).toBeInstanceOf(Customer);
      expect(result.getName()).toBe(name);
      expect(result.getEmail()).toBe(email);
      expect(result.getCPF()).toBeNull();
      expect(mockCustomerPort.findByEmail).toHaveBeenCalledWith(email);
      expect(mockCustomerPort.save).toHaveBeenCalledWith(expect.any(Customer));
    });

    it('should throw ConflictException when email is already registered', async () => {
      const name = 'John Doe';
      const email = 'john@example.com';
      const existingCustomer = new Customer(
        '123',
        name,
        null,
        email,
        new Date(),
        new Date(),
      );

      mockCustomerPort.findByEmail.mockResolvedValue(existingCustomer);

      await expect(
        service.createCustomerWithEmail(name, email),
      ).rejects.toThrow(ConflictException);
      expect(mockCustomerPort.findByEmail).toHaveBeenCalledWith(email);
      expect(mockCustomerPort.save).not.toHaveBeenCalled();
    });
  });

  describe('findCustomerByEmail', () => {
    it('should find a customer by email successfully', async () => {
      const email = 'john@example.com';
      const mockCustomer = new Customer(
        '123',
        'John Doe',
        null,
        email,
        new Date(),
        new Date(),
      );

      mockCustomerPort.findByEmail.mockResolvedValue(mockCustomer);

      const result = await service.findCustomerByEmail(email);

      expect(result).toBeInstanceOf(Customer);
      expect(result.getEmail()).toBe(email);
      expect(mockCustomerPort.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw CustomerNotFoundException when customer is not found', async () => {
      const email = 'john@example.com';
      mockCustomerPort.findByEmail.mockResolvedValue(null);

      await expect(service.findCustomerByEmail(email)).rejects.toThrow(
        CustomerNotFoundException,
      );
      expect(mockCustomerPort.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('findCustomerByCPF', () => {
    it('should find a customer by CPF successfully', async () => {
      const cpf = '12345678909';
      const mockCustomer = new Customer(
        '123',
        null,
        cpf,
        null,
        new Date(),
        new Date(),
      );

      mockCustomerPort.findByCpf.mockResolvedValue(mockCustomer);

      const result = await service.findCustomerByCPF(cpf);

      expect(result).toBeInstanceOf(Customer);
      expect(result.getCPF()).toBe(cpf);
      expect(mockCustomerPort.findByCpf).toHaveBeenCalledWith(cpf);
    });

    it('should throw CustomerNotFoundException when customer is not found', async () => {
      const cpf = '12345678909';
      mockCustomerPort.findByCpf.mockResolvedValue(null);

      await expect(service.findCustomerByCPF(cpf)).rejects.toThrow(
        CustomerNotFoundException,
      );
      expect(mockCustomerPort.findByCpf).toHaveBeenCalledWith(cpf);
    });

    it('should throw Error when CPF is invalid', async () => {
      const invalidCpf = '12345678900';

      await expect(service.findCustomerByCPF(invalidCpf)).rejects.toThrow(
        'Invalid CPF',
      );
      expect(mockCustomerPort.findByCpf).not.toHaveBeenCalled();
    });
  });
});
