import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../domain/entities/order.entity';

export class OrderQueueResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  orderId: string;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.RECEIVED,
    description: 'Status atual do pedido na fila',
  })
  status: OrderStatus;

  @ApiProperty({ example: '2024-03-06T01:44:36.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-06T01:44:36.000Z' })
  updatedAt: Date;
}
