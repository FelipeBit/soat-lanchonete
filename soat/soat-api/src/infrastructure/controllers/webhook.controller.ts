import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { WebhookService, PaymentWebhookPayload } from '../../application/services/webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receber confirmação de pagamento do Mercado Pago',
    description: 'Endpoint para receber webhooks do Mercado Pago sobre status de pagamentos',
  })
  @ApiHeader({
    name: 'X-Webhook-Signature',
    description: 'Assinatura do webhook para validação (opcional)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Payload inválido ou erro de processamento',
  })
  async receivePaymentWebhook(
    @Body() payload: PaymentWebhookPayload,
    @Headers('x-signature') signature?: string,
  ): Promise<{ message: string }> {
    try {
      await this.webhookService.processPaymentWebhook(payload, signature);
      
      return {
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw new BadRequestException(`Failed to process webhook: ${error.message}`);
    }
  }
} 