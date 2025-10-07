import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../adapters/database/entities/product.entity';
import { ProductAdapter } from '../adapters/database/product.adapter';
import { ProductApplicationService } from '../../application/services/product.application.service';
import { ProductController } from '../controllers/product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductController],
  providers: [
    {
      provide: 'ProductPort',
      useClass: ProductAdapter,
    },
    ProductApplicationService,
  ],
  exports: ['ProductPort'],
})
export class ProductModule {}
