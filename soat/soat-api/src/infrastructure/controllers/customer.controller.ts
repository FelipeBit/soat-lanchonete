import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CustomerApplicationService } from '../../application/services/customer.application.service';
import { CreateCustomerWithCPFDto } from './dtos/create-customer-with-cpf.dto';
import { CreateCustomerWithEmailDto } from './dtos/create-customer-with-email.dto';
import { isValidCPF } from '../../domain/utils/cpf.validator';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(
    private readonly customerApplicationService: CustomerApplicationService,
  ) {}

  @Post('cpf')
  @ApiOperation({ summary: 'Create a new customer with CPF' })
  @ApiBody({ type: CreateCustomerWithCPFDto })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CreateCustomerWithCPFDto,
  })
  @ApiResponse({
    status: 409,
    description: 'CPF já cadastrado',
  })
  async createCustomerWithCPF(@Body() body: CreateCustomerWithCPFDto) {
    this.logger.debug(`Received CPF creation request: ${JSON.stringify(body)}`);

    if (!isValidCPF(body.cpf)) {
      this.logger.warn(`Invalid CPF format: ${body.cpf}`);
      throw new BadRequestException('Invalid CPF');
    }

    try {
      const customer =
        await this.customerApplicationService.createCustomerWithCPF(body.cpf);
      this.logger.debug(`Customer created successfully with CPF: ${body.cpf}`);
      return customer;
    } catch (error) {
      this.logger.error(`Error creating customer with CPF: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('email')
  @ApiOperation({ summary: 'Create a new customer with email' })
  @ApiBody({ type: CreateCustomerWithEmailDto })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CreateCustomerWithEmailDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado',
  })
  async createCustomerWithEmail(@Body() body: CreateCustomerWithEmailDto) {
    this.logger.debug(
      `Received email creation request: ${JSON.stringify(body)}`,
    );

    try {
      const customer =
        await this.customerApplicationService.createCustomerWithEmail(
          body.name,
          body.email,
        );
      this.logger.debug(
        `Customer created successfully with email: ${body.email}`,
      );
      return customer;
    } catch (error) {
      this.logger.error(`Error creating customer with email: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Find customer by email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer found',
  })
  async findCustomerByEmail(@Param('email') email: string) {
    this.logger.debug(`Searching for customer with email: ${email}`);
    return this.customerApplicationService.findCustomerByEmail(email);
  }

  @Get('cpf/:cpf')
  @ApiOperation({ summary: 'Find customer by CPF' })
  @ApiParam({ name: 'cpf', type: String })
  @ApiResponse({
    status: 200,
    description: 'Customer found',
  })
  async findCustomerByCPF(@Param('cpf') cpf: string) {
    this.logger.debug(`Searching for customer with CPF: ${cpf}`);

    if (!isValidCPF(cpf)) {
      this.logger.warn(`Invalid CPF format: ${cpf}`);
      throw new BadRequestException('Invalid CPF');
    }
    return this.customerApplicationService.findCustomerByCPF(cpf);
  }
}
