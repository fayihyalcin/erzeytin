import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../catalog/product.entity';
import { SettingsModule } from '../settings/settings.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AdminUser } from '../users/admin-user.entity';
import { OrderActivity } from './order-activity.entity';
import { Order } from './order.entity';
import { PaymentTransaction } from './payment-transaction.entity';
import { PaytrService } from './paytr.service';
import {
  AdminOrdersController,
  ShopOrdersController,
  ShopPaymentsController,
} from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderActivity, PaymentTransaction, AdminUser, Product]),
    SettingsModule,
    RealtimeModule,
  ],
  controllers: [AdminOrdersController, ShopOrdersController, ShopPaymentsController],
  providers: [OrdersService, PaytrService],
  exports: [OrdersService],
})
export class OrdersModule {}
