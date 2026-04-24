import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';
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
import { PaymentTransaction } from './orders/payment-transaction.entity';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { MediaModule } from './media/media.module';
import { SeoModule } from './seo/seo.module';
import { LandingPagesModule } from './landing-pages/landing-pages.module';
import { LandingPage } from './landing-pages/landing-page.entity';

function getConfigValue(
  configService: ConfigService,
  key: string,
  fallback: string,
) {
  const value = configService.get<string>(key);
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '../../.env'),
        resolve(process.cwd(), '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: getConfigValue(configService, 'DB_HOST', 'localhost'),
        port: Number(getConfigValue(configService, 'DB_PORT', '5432')),
        username: getConfigValue(configService, 'DB_USER', 'postgres'),
        password: getConfigValue(configService, 'DB_PASSWORD', 'postgres'),
        database: getConfigValue(configService, 'DB_NAME', 'zeytin_admin'),
        entities: [
          AdminUser,
          Setting,
          Category,
          Product,
          LandingPage,
          Order,
          OrderActivity,
          PaymentTransaction,
        ],
        synchronize: getConfigValue(configService, 'DB_SYNC', 'true') === 'true',
        ssl:
          getConfigValue(configService, 'DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    TypeOrmModule.forFeature([AdminUser, Setting, Category, Product]),
    RedisModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    MediaModule,
    SeoModule,
    LandingPagesModule,
    SettingsModule,
    CatalogModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
