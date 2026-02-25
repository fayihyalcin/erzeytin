import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminUser } from './users/admin-user.entity';
import { Setting } from './settings/setting.entity';
import { Category } from './catalog/category.entity';
import { Product } from './catalog/product.entity';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { CatalogModule } from './catalog/catalog.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SeedService } from './seed/seed.service';
import { Order } from './orders/order.entity';
import { OrderActivity } from './orders/order-activity.entity';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '5432')),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'zeytin_admin'),
        entities: [AdminUser, Setting, Category, Product, Order, OrderActivity],
        synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
        ssl:
          configService.get<string>('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    TypeOrmModule.forFeature([AdminUser, Setting, Category, Product]),
    RedisModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    CatalogModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
