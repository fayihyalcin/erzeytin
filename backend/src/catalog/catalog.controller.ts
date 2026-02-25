import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('public/categories')
  findPublicCategories() {
    return this.catalogService.findPublicCategories();
  }

  @Get('public/products')
  findPublicProducts() {
    return this.catalogService.findPublicProducts();
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  findCategories() {
    return this.catalogService.findCategories();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard)
  updateCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard)
  findProducts() {
    return this.catalogService.findProducts();
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard)
  updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(id, dto);
  }
}
