import {
  Controller,
  Post,
  Get,
  Body as BodyDecorator,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { OrderApplicationService } from '../../application/services/order.application.service';
import { CheckoutOrderUseCase } from '../../application/use-cases/checkout-order.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { OrderStatus, PaymentStatus } from '../../domain/entities/order.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { CheckoutResponseDto } from './dtos/checkout-response.dto';
import { PaymentStatusResponseDto } from './dtos/payment-status-response.dto';
import {
  OrderListResponseDto,
  OrderDetailDto,
} from './dtos/order-list-response.dto';

@ApiTags('orders')
@Controller('orders')
@UsePipes(new ValidationPipe({ transform: true }))
export class OrderController {
  constructor(
    private readonly orderApplicationService: OrderApplicationService,
    private readonly checkoutOrderUseCase: CheckoutOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  @Post('checkout')
  @ApiOperation({
    summary: 'Checkout order with products and return order identification',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description:
      'Order created successfully with total amount and item details',
    type: CheckoutResponseDto,
  })
  async processCheckout(
    @BodyDecorator() checkoutRequest: CreateOrderDto,
  ): Promise<CheckoutResponseDto> {
    const result = await this.checkoutOrderUseCase.execute({
      customerId: checkoutRequest.customerId,
      items: checkoutRequest.items,
    });

    return {
      order: {
        id: result.orderId,
        customerId: checkoutRequest.customerId,
        customerCPF: null,
        items: checkoutRequest.items,
        status: result.status,
        paymentStatus: result.paymentStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      totalAmount: result.totalAmount,
      items: result.items,
    };
  }

  @Post(':orderId/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'orderId', type: String, description: 'Order ID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @BodyDecorator() statusUpdate: UpdateOrderStatusDto,
  ) {
    const result = await this.updateOrderStatusUseCase.execute({
      orderId,
      status: statusUpdate.status,
    });

    return {
      orderId: result.orderId,
      status: result.status,
      updatedAt: result.updatedAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: 200,
    description: 'List of all orders',
  })
  async getAllOrders() {
    return this.orderApplicationService.findAllOrders();
  }

  @Get('status/:orderStatus')
  @ApiOperation({ summary: 'Get orders by status' })
  @ApiParam({
    name: 'orderStatus',
    type: 'string',
    enum: Object.values(OrderStatus),
    description: 'Order status filter',
  })
  @ApiResponse({
    status: 200,
    description: 'List of orders with specified status',
  })
  async getOrdersByStatus(@Param('orderStatus') orderStatus: OrderStatus) {
    return this.orderApplicationService.findOrdersByStatus(orderStatus);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer ID' })
  @ApiParam({
    name: 'customerId',
    type: String,
    description: 'Customer ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of customer orders',
  })
  async getOrdersByCustomerId(@Param('customerId') customerId: string) {
    return this.orderApplicationService.findOrdersByCustomerId(customerId);
  }

  @Get('queue')
  @ApiOperation({
    summary: 'Get orders in queue with details and priority ordering',
    description:
      'Returns orders in queue (excluding FINISHED) with product details, ordered by: 1) Status priority (READY > IN_PREPARATION > RECEIVED), 2) Creation date (oldest first)',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders in queue retrieved successfully with details',
    type: OrderListResponseDto,
  })
  async getActiveOrdersWithDetails(): Promise<OrderListResponseDto> {
    const ordersWithDetails =
      await this.orderApplicationService.findActiveOrdersWithDetails();

    const orderDetails: OrderDetailDto[] = ordersWithDetails.map(
      (orderData) => ({
        id: orderData.order.id,
        customerId: orderData.order.customerId,
        customerCPF: orderData.order.customerCPF,
        status: orderData.order.status,
        paymentStatus: orderData.order.paymentStatus,
        createdAt: orderData.order.createdAt,
        updatedAt: orderData.order.updatedAt,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
      }),
    );

    return {
      orders: orderDetails,
      totalCount: orderDetails.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Order details',
  })
  async findOrderById(@Param('id') id: string) {
    return this.orderApplicationService.findOrderById(id);
  }

  @Get(':id/payment-status')
  @ApiOperation({ summary: 'Get payment status of an order' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async getPaymentStatus(
    @Param('id') id: string,
  ): Promise<PaymentStatusResponseDto> {
    return this.orderApplicationService.getPaymentStatus(id);
  }

  @Post(':id/payment-status')
  @ApiOperation({ summary: 'Update payment status of an order' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentStatus: {
          type: 'string',
          enum: Object.values(PaymentStatus),
          example: 'APPROVED',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async updatePaymentStatus(
    @Param('id') id: string,
    @BodyDecorator() body: { paymentStatus: PaymentStatus },
  ) {
    return this.orderApplicationService.updatePaymentStatus(
      id,
      body.paymentStatus,
    );
  }
}
