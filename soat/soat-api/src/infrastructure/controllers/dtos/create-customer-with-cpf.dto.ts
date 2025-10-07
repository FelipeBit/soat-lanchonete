import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateCustomerWithCPFDto {
  @ApiProperty({
    description: 'Customer CPF',
    example: '12345678900',
  })
  @IsString()
  @IsNotEmpty()
  cpf: string;
}
