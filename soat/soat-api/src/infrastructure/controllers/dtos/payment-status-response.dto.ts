import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../../../domain/entities/order.entity';

export class PaymentStatusResponseDto {
  @ApiProperty({ 
    example: 'order-uuid', 
    description: 'ID do pedido' 
  })
  orderId: string;

  @ApiProperty({ 
    example: 'APPROVED', 
    description: 'Status do pagamento',
    enum: PaymentStatus 
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({ 
    example: true, 
    description: 'Indica se o pagamento foi aprovado' 
  })
  isApproved: boolean;
} 