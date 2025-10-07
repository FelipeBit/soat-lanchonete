import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerAdapter } from '../../../../src/infrastructure/adapters/database/customer.adapter';
import { CustomerEntity } from '../../../../src/infrastructure/adapters/database/entities/customer.entity';
import { Customer } from '../../../../src/domain/entities/customer.entity';
import { CustomerNotFoundException } from '../../../../src/domain/exceptions/customer.exception';

describe('CustomerAdapter', () => {
  let adapter: CustomerAdapter;
  let repository: Repository<CustomerEntity>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerAdapter,
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    adapter = module.get<CustomerAdapter>(CustomerAdapter);
    repository = module.get<Repository<CustomerEntity>>(
      getRepositoryToken(CustomerEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a customer successfully', async () => {
      const customer = new Customer(
        '123',
        'John Doe',
        '12345678909',
        'john@example.com',
        new Date(),
        new Date(),
      );

      const mockEntity = new CustomerEntity();
      mockEntity.id = customer.getId();
      mockEntity.name = customer.getName();
      mockEntity.cpf = customer.getCPF();
      mockEntity.email = customer.getEmail();
      mockEntity.createdAt = customer.getCreatedAt();
      mockEntity.updatedAt = customer.getUpdatedAt();

      mockRepository.create.mockReturnValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockEntity);

      const result = await adapter.save(customer);

      expect(result).toEqual(customer);
      expect(mockRepository.create).toHaveBeenCalledWith({
        id: customer.getId(),
        name: customer.getName(),
        cpf: customer.getCPF(),
        email: customer.getEmail(),
        createdAt: customer.getCreatedAt(),
        updatedAt: customer.getUpdatedAt(),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntity);
    });
  });

  describe('findById', () => {
    it('should find a customer by id successfully', async () => {
      const customerId = '123';
      const mockEntity = new CustomerEntity();
      mockEntity.id = customerId;
      mockEntity.name = 'John Doe';
      mockEntity.cpf = '12345678909';
      mockEntity.email = 'john@example.com';
      mockEntity.createdAt = new Date();
      mockEntity.updatedAt = new Date();

      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await adapter.findById(customerId);

      expect(result).toBeInstanceOf(Customer);
      expect(result.getId()).toBe(customerId);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: customerId },
      });
    });

    it('should throw CustomerNotFoundException when customer not found', async () => {
      const customerId = '123';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(adapter.findById(customerId)).rejects.toThrow(
        CustomerNotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should find a customer by email successfully', async () => {
      const email = 'john@example.com';
      const mockEntity = new CustomerEntity();
      mockEntity.id = '123';
      mockEntity.name = 'John Doe';
      mockEntity.cpf = '12345678909';
      mockEntity.email = email;
      mockEntity.createdAt = new Date();
      mockEntity.updatedAt = new Date();

      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await adapter.findByEmail(email);

      expect(result).toBeInstanceOf(Customer);
      expect(result.getEmail()).toBe(email);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return null when customer not found', async () => {
      const email = 'john@example.com';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await adapter.findByEmail(email);

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });
  });

  describe('findByCpf', () => {
    it('should find a customer by CPF successfully', async () => {
      const cpf = '12345678909';
      const mockEntity = new CustomerEntity();
      mockEntity.id = '123';
      mockEntity.name = 'John Doe';
      mockEntity.cpf = cpf;
      mockEntity.email = 'john@example.com';
      mockEntity.createdAt = new Date();
      mockEntity.updatedAt = new Date();

      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await adapter.findByCpf(cpf);

      expect(result).toBeInstanceOf(Customer);
      expect(result.getCPF()).toBe(cpf);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { cpf } });
    });

    it('should return null when customer not found', async () => {
      const cpf = '12345678909';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await adapter.findByCpf(cpf);

      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { cpf } });
    });
  });
});
