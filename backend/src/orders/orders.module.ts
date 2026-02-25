import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../catalog/product.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { AdminUser } from '../users/admin-user.entity';
import { OrderActivity } from './order-activity.entity';
import { Order } from './order.entity';
import { AdminOrdersController, ShopOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderActivity, AdminUser, Product]),
    RealtimeModule,
  ],
  controllers: [AdminOrdersController, ShopOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
