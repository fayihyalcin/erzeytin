import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../catalog/category.entity';
import { Product } from '../catalog/product.entity';
import { Setting } from '../settings/setting.entity';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, Category, Product])],
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
