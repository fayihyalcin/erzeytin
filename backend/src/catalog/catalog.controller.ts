import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PublicProductsQueryDto } from './dto/public-products-query.dto';
import { PublicRelatedProductsQueryDto } from './dto/public-related-products-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('public/categories')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findPublicCategories() {
    return this.catalogService.findPublicCategories();
  }

  @Get('public/products/:id/related')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findRelatedPublicProducts(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: PublicRelatedProductsQueryDto,
  ) {
    return this.catalogService.findRelatedPublicProducts(id, query.limit);
  }

  @Get('public/products/list')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findPublicProductsPage(@Query() query: PublicProductsQueryDto) {
    return this.catalogService.findPublicProductsPage(query);
  }

  @Get('public/products/resolve/:reference')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findPublicProductByReference(@Param('reference') reference: string) {
    return this.catalogService.findPublicProductByReference(reference);
  }

  @Get('public/products/:id')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findPublicProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogService.findPublicProductById(id);
  }

  @Get('public/products')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findPublicProducts() {
    return this.catalogService.findPublicProducts();
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  findCategories(@Query() query: ListCategoriesQueryDto) {
    return this.catalogService.findCategories(query);
  }

  @Get('categories/summary')
  @UseGuards(JwtAuthGuard)
  getCategorySummary() {
    return this.catalogService.getCategorySummary();
  }

  @Get('categories/:id')
  @UseGuards(JwtAuthGuard)
  findCategoryById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogService.findCategoryById(id);
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

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  deleteCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogService.deleteCategory(id);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard)
  findProducts(@Query() query: ListProductsQueryDto) {
    return this.catalogService.findProducts(query);
  }

  @Get('products/summary')
  @UseGuards(JwtAuthGuard)
  getProductSummary() {
    return this.catalogService.getProductSummary();
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard)
  findProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogService.findProductById(id);
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

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  deleteProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.catalogService.deleteProduct(id);
  }
}
