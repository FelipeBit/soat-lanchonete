import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from '../../../domain/entities/order.entity';

export class OrderItemDetailDto {
  @ApiProperty({ example: 'product-uuid', description: 'ID do produto' })
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantidade do produto' })
  quantity: number;

  @ApiProperty({ example: 'X-Burger', description: 'Nome do produto' })
  productName: string;

  @ApiProperty({ 
    example: 'Hambúrguer artesanal com queijo e bacon', 
    description: 'Descrição do produto' 
  })
  productDescription: string;

  @ApiProperty({ example: 15.99, description: 'Preço unitário do produto' })
  price: number;

  @ApiProperty({ example: 31.98, description: 'Valor total do item' })
  total: number;
}

export class OrderDetailDto {
  @ApiProperty({ example: 'order-uuid', description: 'ID do pedido' })
  id: string;

  @ApiProperty({ 
    example: 'customer-uuid', 
    description: 'ID do cliente (opcional)',
    nullable: true 
  })
  customerId: string | null;

  @ApiProperty({ 
    example: '123.456.789-00', 
    description: 'CPF do cliente (opcional)',
    nullable: true 
  })
  customerCPF: string | null;

  @ApiProperty({ 
    example: 'READY', 
    description: 'Status do pedido',
    enum: OrderStatus 
  })
  status: OrderStatus;

  @ApiProperty({ 
    example: 'APPROVED', 
    description: 'Status do pagamento',
    enum: PaymentStatus 
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00.000Z', 
    description: 'Data de criação do pedido' 
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2024-01-15T10:35:00.000Z', 
    description: 'Data da última atualização do pedido' 
  })
  updatedAt: Date;

  @ApiProperty({ 
    type: [OrderItemDetailDto], 
    description: 'Itens do pedido com detalhes dos produtos' 
  })
  items: OrderItemDetailDto[];

  @ApiProperty({ 
    example: 45.97, 
    description: 'Valor total do pedido' 
  })
  totalAmount: number;
}

export class OrderListResponseDto {
  @ApiProperty({ 
    type: [OrderDetailDto], 
    description: 'Lista de pedidos ativos ordenados por prioridade' 
  })
  orders: OrderDetailDto[];

  @ApiProperty({ 
    example: 5, 
    description: 'Total de pedidos na lista' 
  })
  totalCount: number;
} 