import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsIn, IsOptional, IsPositive } from 'class-validator';

export class PaymentWebhookDto {
  @ApiProperty({
    example: 'order-uuid-123',
    description: 'ID do pedido associado ao pagamento',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    example: 'pay-uuid-456',
    description: 'ID do pagamento fornecido pelo provedor de pagamento',
  })
  @IsString()
  paymentId: string;

  @ApiProperty({
    example: 'approved',
    description: 'Status do pagamento',
    enum: ['approved', 'rejected', 'cancelled'],
  })
  @IsIn(['approved', 'rejected', 'cancelled'])
  status: 'approved' | 'rejected' | 'cancelled';

  @ApiProperty({
    example: 45.97,
    description: 'Valor do pagamento',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: 'BRL',
    description: 'Moeda do pagamento',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    example: '2024-01-15T10:35:00.000Z',
    description: 'Timestamp do pagamento',
  })
  @IsString()
  timestamp: string;

  @ApiProperty({
    example: 'webhook-signature-hash',
    description: 'Assinatura do webhook para validação de segurança',
    required: false,
  })
  @IsOptional()
  @IsString()
  signature?: string;
} 