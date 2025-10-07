import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class InitializeOrderDto {
  @ApiProperty({
    description: 'Optional customer ID to associate with the order',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    description: 'Customer CPF (must be valid)',
    required: false,
    nullable: true,
    example: '12345678909',
  })
  @IsOptional()
  @IsString()
  customerCPF?: string;
}
