import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../../../domain/entities/product.entity';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'X-Burger',
    description: 'Nome do produto',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Hambúrguer artesanal com queijo e alface',
    description: 'Descrição do produto',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 25.9,
    description: 'Preço do produto',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    enum: ProductCategory,
    example: ProductCategory.BURGER,
    description:
      'Categoria do produto (BURGER=Lanche, SIDE_DISH=Acompanhamento, BEVERAGE=Bebida, DESSERT=Sobremesa)',
  })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({
    example: 'https://example.com/burger.jpg',
    required: false,
    description: 'URL da imagem do produto',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
