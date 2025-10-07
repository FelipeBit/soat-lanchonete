import { ApiProperty } from '@nestjs/swagger';

export class QRCodeResponseDto {
  @ApiProperty({
    description: 'ID do pedido',
    example: 'order-uuid-123',
  })
  orderId: string;

  @ApiProperty({
    description: 'Dados do QR Code para exibição',
    example: '00020126580014br.gov.bcb.pix0136a629532e-7693-4849-8f96-7c4b4d4b4b4b5204000053039865405100.005802BR5913Restaurante ABC6008São Paulo62070503***6304E2CA',
  })
  qrData: string;

  @ApiProperty({
    description: 'QR Code em formato base64 para exibição',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCodeBase64: string;

  @ApiProperty({
    description: 'Valor total do pedido (calculado automaticamente)',
    example: 45.50,
  })
  totalAmount?: number;

  @ApiProperty({
    description: 'Descrição do pedido',
    example: 'Pedido #123 - 2x Hambúrguer, 1x Batata Frita',
  })
  description: string;

  @ApiProperty({
    description: 'URL de notificação do webhook',
    example: 'https://api.example.com/webhooks/payment',
  })
  notificationUrl: string;

  @ApiProperty({
    description: 'Data de criação do QR Code',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;
} 