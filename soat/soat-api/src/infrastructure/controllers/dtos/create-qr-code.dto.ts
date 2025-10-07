import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQRCodeDto {
  @ApiProperty({
    description: 'ID do pedido',
    example: 'order-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Valor total do pedido',
    example: 45.50,
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    description: 'Descrição do pedido (opcional)',
    example: 'Pedido #123 - 2x Hambúrguer, 1x Batata Frita',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
} 