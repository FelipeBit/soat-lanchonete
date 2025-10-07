import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ProductApplicationService } from '../../application/services/product.application.service';
import { ProductCategory } from '../../domain/entities/product.entity';
import { CreateProductDto } from './dtos/create-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly productApplicationService: ProductApplicationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: CreateProductDto,
  })
  async createProduct(@Body() body: CreateProductDto) {
    this.logger.debug(
      `Received product creation request: ${JSON.stringify(body)}`,
    );

    try {
      const product = await this.productApplicationService.createProduct(
        body.name,
        body.description,
        body.price,
        body.category,
        body.imageUrl,
      );
      this.logger.debug(`Product created successfully: ${product.getId()}`);
      return product;
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: CreateProductDto,
  })
  async updateProduct(@Param('id') id: string, @Body() body: CreateProductDto) {
    this.logger.debug(
      `Received product update request for ID ${id}: ${JSON.stringify(body)}`,
    );

    try {
      const product = await this.productApplicationService.updateProduct(
        id,
        body.name,
        body.description,
        body.price,
        body.category,
        body.imageUrl,
      );
      this.logger.debug(`Product updated successfully: ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`Error updating product: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  async deleteProduct(@Param('id') id: string) {
    this.logger.debug(`Received product deletion request for ID: ${id}`);

    try {
      await this.productApplicationService.deleteProduct(id);
      this.logger.debug(`Product deleted successfully: ${id}`);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting product: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find product by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: CreateProductDto,
  })
  async findProductById(@Param('id') id: string) {
    this.logger.debug(`Searching for product with ID: ${id}`);

    try {
      const product = await this.productApplicationService.findProductById(id);
      if (!product) {
        throw new BadRequestException('Product not found');
      }
      return product;
    } catch (error) {
      this.logger.error(`Error finding product: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Find products by category' })
  @ApiParam({ name: 'category', enum: ProductCategory })
  @ApiResponse({
    status: 200,
    description: 'Products found',
    type: [CreateProductDto],
  })
  async findProductsByCategory(@Param('category') category: ProductCategory) {
    this.logger.debug(`Searching for products in category: ${category}`);

    try {
      const products =
        await this.productApplicationService.findProductsByCategory(category);
      return products;
    } catch (error) {
      this.logger.error(`Error finding products by category: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
