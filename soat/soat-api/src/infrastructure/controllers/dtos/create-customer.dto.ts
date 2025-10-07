import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome do cliente',
  })
  name: string;

  @ApiProperty({
    example: 'joao.silva@email.com',
    description: 'Email do cliente',
  })
  email: string;

  @ApiProperty({
    example: '123.456.789-00',
    required: false,
    description: 'CPF do cliente',
  })
  cpf?: string;
}
