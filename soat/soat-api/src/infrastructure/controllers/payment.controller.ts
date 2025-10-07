import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { OrderApplicationService } from '../../application/services/order.application.service';
import { MercadoPagoService } from '../../application/services/mercado-pago.service';
import { CreateQRCodeDto } from './dtos/create-qr-code.dto';
import { QRCodeResponseDto } from './dtos/qr-code-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly orderApplicationService: OrderApplicationService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Post('qr-code')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gerar QR Code de pagamento',
    description: 'Cria um QR Code do Mercado Pago para pagamento de um pedido',
  })
  @ApiBody({ type: CreateQRCodeDto })
  @ApiResponse({
    status: 201,
    description: 'QR Code gerado com sucesso',
    type: QRCodeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou erro ao gerar QR Code',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado',
  })
  async generateQRCode(@Body() createQRCodeDto: CreateQRCodeDto): Promise<QRCodeResponseDto> {
    try {
      // Verificar se o pedido existe
      const order = await this.orderApplicationService.findById(createQRCodeDto.orderId);
      if (!order) {
        throw new BadRequestException('Order not found');
      }

      // Verificar se o pedido já tem QR Code
      if (order.getPaymentStatus() !== 'PENDING') {
        throw new BadRequestException('Order is not in pending status');
      }

      // Gerar URL de notificação
      const notificationUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/webhooks/payment`;

      // Criar QR Code no Mercado Pago
      const qrCodeData = await this.mercadoPagoService.createQRCodeOrder(
        createQRCodeDto.orderId,
        createQRCodeDto.totalAmount,
        createQRCodeDto.description,
        notificationUrl,
      );

      return {
        orderId: createQRCodeDto.orderId,
        qrData: qrCodeData.qr_data,
        qrCodeBase64: qrCodeData.qr_code_base64,
        totalAmount: createQRCodeDto.totalAmount,
        description: createQRCodeDto.description,
        notificationUrl: qrCodeData.notification_url,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new BadRequestException(`Failed to generate QR code: ${error.message}`);
    }
  }
} 