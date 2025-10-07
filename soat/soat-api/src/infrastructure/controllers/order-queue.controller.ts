import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrderQueueApplicationService } from '../../application/services/order-queue.application.service';
import { OrderQueueResponseDto } from './dtos/order-queue-response.dto';
import { HideFromSwagger } from '../decorators/hide-route.decorator';

@ApiTags('order-queue')
@Controller('order-queue')
@HideFromSwagger()
@UsePipes(new ValidationPipe({ transform: true }))
export class OrderQueueController {
  constructor(
    private readonly orderQueueApplicationService: OrderQueueApplicationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os pedidos na fila' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos os pedidos na fila',
    type: [OrderQueueResponseDto],
  })
  async listAllOrders() {
    const orders = await this.orderQueueApplicationService.getAllOrders();
    return orders.map((order) => ({
      id: order.getId(),
      orderId: order.getOrderId(),
      status: order.getStatus(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt(),
    }));
  }
}
