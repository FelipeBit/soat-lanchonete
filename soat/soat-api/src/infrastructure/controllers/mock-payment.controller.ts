import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { OrderApplicationService } from '../../application/services/order.application.service';
import { MockPaymentService } from '../../application/services/mock-payment.service';
import { MockWebhookService } from '../../application/services/mock-webhook.service';
import { CreateQRCodeDto } from './dtos/create-qr-code.dto';
import { QRCodeResponseDto } from './dtos/qr-code-response.dto';

@ApiTags('Mock Payments')
@Controller('mock-payments')
export class MockPaymentController {
  constructor(
    private readonly orderApplicationService: OrderApplicationService,
    private readonly mockPaymentService: MockPaymentService,
    private readonly mockWebhookService: MockWebhookService,
  ) {}

  @Post('qr-code')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gerar QR Code de pagamento (Mock)',
    description: 'Cria um QR Code mockado para pagamento de um pedido',
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
      const notificationUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/mock-payments/webhook`;

      // Criar QR Code mockado (apenas com ID do pedido)
      const qrCodeData = await this.mockPaymentService.createQRCodeOrder(
        createQRCodeDto.orderId,
        createQRCodeDto.description || `Pedido ${createQRCodeDto.orderId}`,
        notificationUrl,
      );

      // Calcular total baseado nos itens do pedido
      let totalAmount = 0;
      for (const item of order.getItems()) {
        // Por simplicidade, vamos usar um valor mockado
        totalAmount += 15.90 * item.quantity; // Valor mockado por item
      }

      return {
        orderId: createQRCodeDto.orderId,
        qrData: qrCodeData.qr_data,
        qrCodeBase64: qrCodeData.qr_code_base64,
        totalAmount,
        description: createQRCodeDto.description || `Pedido ${createQRCodeDto.orderId}`,
        notificationUrl: qrCodeData.notification_url,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[MOCK] Error generating QR code:', error);
      throw new BadRequestException(`Failed to generate QR code: ${error.message}`);
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receber webhook de pagamento (Mock)',
    description: 'Endpoint para receber webhooks mockados sobre status de pagamentos',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Payload inválido ou erro de processamento',
  })
  async receivePaymentWebhook(@Body() payload: any): Promise<{ message: string }> {
    try {
      await this.mockWebhookService.processPaymentWebhook(payload);
      
      return {
        message: 'Mock webhook processed successfully',
      };
    } catch (error) {
      console.error('[MOCK] Error processing webhook:', error);
      throw new BadRequestException(`Failed to process webhook: ${error.message}`);
    }
  }

  @Post('simulate-approval/:paymentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simular aprovação de pagamento',
    description: 'Simula a aprovação de um pagamento pendente',
  })
  @ApiParam({ name: 'paymentId', description: 'ID do pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Pagamento aprovado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Pagamento não encontrado ou erro de processamento',
  })
  async simulatePaymentApproval(@Param('paymentId') paymentId: string): Promise<{ message: string; paymentId: string }> {
    try {
      await this.mockWebhookService.simulatePaymentApprovalWebhook(paymentId);
      
      return {
        message: 'Payment approved successfully',
        paymentId,
      };
    } catch (error) {
      console.error('[MOCK] Error simulating payment approval:', error);
      throw new BadRequestException(`Failed to approve payment: ${error.message}`);
    }
  }

  @Post('simulate-rejection/:paymentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simular rejeição de pagamento',
    description: 'Simula a rejeição de um pagamento pendente',
  })
  @ApiParam({ name: 'paymentId', description: 'ID do pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Pagamento rejeitado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Pagamento não encontrado ou erro de processamento',
  })
  async simulatePaymentRejection(@Param('paymentId') paymentId: string): Promise<{ message: string; paymentId: string }> {
    try {
      await this.mockWebhookService.simulatePaymentRejectionWebhook(paymentId);
      
      return {
        message: 'Payment rejected successfully',
        paymentId,
      };
    } catch (error) {
      console.error('[MOCK] Error simulating payment rejection:', error);
      throw new BadRequestException(`Failed to reject payment: ${error.message}`);
    }
  }

  @Post('simulate-cancellation/:paymentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simular cancelamento de pagamento',
    description: 'Simula o cancelamento de um pagamento',
  })
  @ApiParam({ name: 'paymentId', description: 'ID do pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Pagamento cancelado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Pagamento não encontrado ou erro de processamento',
  })
  async simulatePaymentCancellation(@Param('paymentId') paymentId: string): Promise<{ message: string; paymentId: string }> {
    try {
      await this.mockWebhookService.simulatePaymentCancellationWebhook(paymentId);
      
      return {
        message: 'Payment cancelled successfully',
        paymentId,
      };
    } catch (error) {
      console.error('[MOCK] Error simulating payment cancellation:', error);
      throw new BadRequestException(`Failed to cancel payment: ${error.message}`);
    }
  }

  @Get('status/:paymentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar status de pagamento (Mock)',
    description: 'Consulta o status de um pagamento mockado',
  })
  @ApiParam({ name: 'paymentId', description: 'ID do pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Status do pagamento retornado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Pagamento não encontrado',
  })
  async getPaymentStatus(@Param('paymentId') paymentId: string): Promise<any> {
    try {
      const paymentData = await this.mockPaymentService.getPaymentStatus(paymentId);
      
      return {
        paymentId,
        status: paymentData.status,
        statusDetail: paymentData.status_detail,
        amount: paymentData.transaction_amount,
        orderId: paymentData.external_reference,
        createdAt: paymentData.date_created,
        updatedAt: paymentData.date_last_updated,
        payer: paymentData.payer,
      };
    } catch (error) {
      console.error('[MOCK] Error getting payment status:', error);
      throw new BadRequestException(`Failed to get payment status: ${error.message}`);
    }
  }

  @Get('pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar pagamentos pendentes (Mock)',
    description: 'Lista todos os pagamentos pendentes no sistema mockado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagamentos pendentes retornada com sucesso',
  })
  async getPendingPayments(): Promise<{ payments: Array<{ paymentId: string; orderId: string; amount: number; status: string }> }> {
    try {
      const payments = await this.mockPaymentService.getPendingPayments();
      
      return {
        payments,
      };
    } catch (error) {
      console.error('[MOCK] Error getting pending payments:', error);
      throw new BadRequestException(`Failed to get pending payments: ${error.message}`);
    }
  }

  @Post('clear-old-payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpar pagamentos antigos (Mock)',
    description: 'Remove pagamentos antigos do sistema mockado',
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamentos antigos removidos com sucesso',
  })
  async clearOldPayments(): Promise<{ message: string }> {
    try {
      await this.mockPaymentService.clearOldPayments(24); // 24 horas
      
      return {
        message: 'Old payments cleared successfully',
      };
    } catch (error) {
      console.error('[MOCK] Error clearing old payments:', error);
      throw new BadRequestException(`Failed to clear old payments: ${error.message}`);
    }
  }
} 