import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID do produto',
  })
  productId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantidade do produto',
    minimum: 1,
  })
  quantity: number;
}
