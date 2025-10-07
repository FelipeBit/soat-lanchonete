import { ApiProperty } from '@nestjs/swagger';
import {
  OrderStatus,
  PaymentStatus,
} from '../../../domain/entities/order.entity';

export class CheckoutItemDto {
  @ApiProperty({ example: 'product-uuid', description: 'ID do produto' })
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantidade do produto' })
  quantity: number;

  @ApiProperty({ example: 15.99, description: 'Preço unitário do produto' })
  price: number;

  @ApiProperty({
    example: 31.98,
    description: 'Valor total do item (preço * quantidade)',
  })
  total: number;
}

export class CheckoutOrderDto {
  @ApiProperty({ example: 'order-uuid', description: 'ID do pedido' })
  id: string;

  @ApiProperty({
    example: 'customer-uuid',
    description: 'ID do cliente (opcional)',
    nullable: true,
  })
  customerId: string | null;

  @ApiProperty({
    example: '123.456.789-00',
    description: 'CPF do cliente (opcional)',
    nullable: true,
  })
  customerCPF: string | null;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
      },
    },
    description: 'Itens do pedido',
  })
  items: Array<{ productId: string; quantity: number }>;

  @ApiProperty({
    example: 'RECEIVED',
    description: 'Status do pedido',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @ApiProperty({
    example: 'PENDING',
    description: 'Status do pagamento',
    enum: PaymentStatus,
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Data de criação do pedido',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Data da última atualização do pedido',
  })
  updatedAt: Date;
}

export class CheckoutResponseDto {
  @ApiProperty({
    type: CheckoutOrderDto,
    description: 'Dados do pedido criado',
  })
  order: CheckoutOrderDto;

  @ApiProperty({
    example: 45.97,
    description: 'Valor total do pedido',
  })
  totalAmount: number;

  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Detalhes dos itens com preços e totais',
  })
  items: CheckoutItemDto[];
}
