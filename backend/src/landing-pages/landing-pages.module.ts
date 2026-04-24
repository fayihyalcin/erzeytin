import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderActivity } from '../orders/order-activity.entity';
import { Order } from '../orders/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { LandingPage } from './landing-page.entity';
import { LandingPagesController } from './landing-pages.controller';
import { LandingPagesService } from './landing-pages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LandingPage, Order, OrderActivity]),
    OrdersModule,
    RealtimeModule,
  ],
  controllers: [LandingPagesController],
  providers: [LandingPagesService],
})
export class LandingPagesModule {}
