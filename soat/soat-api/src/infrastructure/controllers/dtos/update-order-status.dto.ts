import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../domain/entities/order.entity';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'Novo status do pedido',
    example: OrderStatus.IN_PREPARATION,
    enumName: 'OrderStatus',
  })
  @IsEnum(OrderStatus, {
    message:
      'Status inválido. Valores permitidos: RECEIVED, IN_PREPARATION, READY, FINISHED',
  })
  status: OrderStatus;
}
