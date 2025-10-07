import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from '../adapters/database/entities/customer.entity';
import { CustomerAdapter } from '../adapters/database/customer.adapter';
import { CustomerApplicationService } from '../../application/services/customer.application.service';
import { CustomerController } from '../controllers/customer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity])],
  controllers: [CustomerController],
  providers: [
    {
      provide: 'CustomerPort',
      useClass: CustomerAdapter,
    },
    CustomerApplicationService,
  ],
})
export class CustomerModule {}
