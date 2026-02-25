import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Product } from './product.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product]), RealtimeModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
