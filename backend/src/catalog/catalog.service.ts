import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  Product,
  ProductExpenseItem,
  ProductPricingPolicy,
  ProductPricingSummary,
} from './product.entity';

type ProductVariant = Product['variants'][number];

interface PricingInput {
  costPrice: number;
  taxRate: number;
  vatIncluded: boolean;
  pricingPolicy: ProductPricingPolicy;
  expenseItems: ProductExpenseItem[];
  currentSalePrice: number;
}

const DEFAULT_PRICING_POLICY: ProductPricingPolicy = {
  targetMarginPercent: 30,
  platformCommissionPercent: 0,
  paymentFeePercent: 0,
  marketingPercent: 0,
  operationalPercent: 0,
  discountBufferPercent: 0,
  packagingCost: 0,
  shippingCost: 0,
  fixedCost: 0,
};

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

  findPublicCategories() {
    return this.categoriesRepository.find({
      where: {
        isActive: true,
      },
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  async findPublicProducts() {
    const products = await this.productsRepository.find({
      where: {
        isActive: true,
      },
      relations: ['category'],
      order: {
        createdAt: 'DESC',
      },
    });

    return products.filter(
      (product) => !product.category || product.category.isActive,
    );
  }

  findCategories() {
    return this.categoriesRepository.find({
      relations: ['products'],
      order: {
        displayOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = await this.generateUniqueCategorySlug(dto.slug ?? dto.name);

    const category = this.categoriesRepository.create({
      name: dto.name,
      slug,
      description: this.toNullable(dto.description),
      imageUrl: this.toNullable(dto.imageUrl),
      displayOrder: dto.displayOrder ?? 0,
      seoTitle: this.toNullable(dto.seoTitle),
      seoDescription: this.toNullable(dto.seoDescription),
      seoKeywords: this.normalizeStringArray(dto.seoKeywords),
      isActive: dto.isActive ?? true,
    });

    const saved = await this.categoriesRepository.save(category);

    await this.realtimeEventsService.emit('catalog.category.created', {
      category: saved,
    });

    return saved;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Kategori bulunamadi.');
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    if (dto.slug !== undefined) {
      category.slug = await this.generateUniqueCategorySlug(dto.slug, id);
    } else if (dto.name !== undefined) {
      category.slug = await this.generateUniqueCategorySlug(dto.name, id);
    }

    if (dto.description !== undefined) {
      category.description = this.toNullable(dto.description);
    }
    if (dto.imageUrl !== undefined) {
      category.imageUrl = this.toNullable(dto.imageUrl);
    }
    if (dto.displayOrder !== undefined) {
      category.displayOrder = dto.displayOrder;
    }
    if (dto.seoTitle !== undefined) {
      category.seoTitle = this.toNullable(dto.seoTitle);
    }
    if (dto.seoDescription !== undefined) {
      category.seoDescription = this.toNullable(dto.seoDescription);
    }
    if (dto.seoKeywords !== undefined) {
      category.seoKeywords = this.normalizeStringArray(dto.seoKeywords);
    }
    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    const saved = await this.categoriesRepository.save(category);

    await this.realtimeEventsService.emit('catalog.category.updated', {
      category: saved,
    });

    return saved;
  }

  findProducts() {
    return this.productsRepository.find({
      relations: ['category'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createProduct(dto: CreateProductDto) {
    const existingSku = await this.productsRepository.findOne({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException('Bu SKU zaten kullaniliyor.');
    }

    const normalizedBarcode = this.toNullable(dto.barcode);
    if (normalizedBarcode) {
      const existingBarcode = await this.productsRepository.findOne({
        where: { barcode: normalizedBarcode },
      });
      if (existingBarcode) {
        throw new ConflictException('Bu barkod zaten kullaniliyor.');
      }
    }

    const category = await this.resolveCategory(dto.categoryId);
    const variants = this.normalizeVariants(dto.variants);
    const hasVariants = dto.hasVariants ?? variants.length > 0;
    const normalizedVariants = hasVariants ? variants : [];
    const resolvedStock = this.resolveProductStock(
      dto.stock,
      hasVariants,
      normalizedVariants,
    );
    const slug = await this.generateUniqueProductSlug(dto.slug ?? dto.name);
    const images = this.normalizeStringArray(dto.images);
    const featuredImage = this.pickFeaturedImage(images, dto.featuredImage);

    const pricingPolicy = this.normalizePricingPolicy(dto.pricingPolicy);
    const expenseItems = this.normalizeExpenseItems(dto.expenseItems);
    const taxRateValue = dto.taxRate ?? 20;
    const vatIncludedValue = dto.vatIncluded ?? true;
    const costPriceValue = dto.costPrice ?? 0;

    const initialPricingSummary = this.calculatePricingSummary({
      costPrice: costPriceValue,
      taxRate: taxRateValue,
      vatIncluded: vatIncludedValue,
      pricingPolicy,
      expenseItems,
      currentSalePrice: dto.price,
    });

    const resolvedPrice = dto.autoPriceFromPolicy
      ? initialPricingSummary.suggestedSalePrice
      : dto.price;

    const pricingSummary = this.calculatePricingSummary({
      costPrice: costPriceValue,
      taxRate: taxRateValue,
      vatIncluded: vatIncludedValue,
      pricingPolicy,
      expenseItems,
      currentSalePrice: resolvedPrice,
    });

    const product = this.productsRepository.create({
      name: dto.name,
      slug,
      sku: dto.sku,
      barcode: normalizedBarcode,
      brand: this.toNullable(dto.brand),
      price: resolvedPrice.toFixed(2),
      compareAtPrice:
        dto.compareAtPrice !== undefined ? dto.compareAtPrice.toFixed(2) : null,
      costPrice: dto.costPrice !== undefined ? dto.costPrice.toFixed(2) : null,
      taxRate: taxRateValue.toFixed(2),
      vatIncluded: vatIncludedValue,
      stock: resolvedStock,
      minStock: dto.minStock ?? 0,
      weight: dto.weight !== undefined ? dto.weight.toFixed(3) : null,
      width: dto.width !== undefined ? dto.width.toFixed(2) : null,
      height: dto.height !== undefined ? dto.height.toFixed(2) : null,
      length: dto.length !== undefined ? dto.length.toFixed(2) : null,
      shortDescription: this.toNullable(dto.shortDescription),
      description: this.toNullable(dto.description),
      tags: this.normalizeStringArray(dto.tags),
      images,
      featuredImage,
      hasVariants,
      variants: normalizedVariants,
      pricingPolicy,
      expenseItems,
      pricingSummary,
      seoTitle: this.toNullable(dto.seoTitle),
      seoDescription: this.toNullable(dto.seoDescription),
      seoKeywords: this.normalizeStringArray(dto.seoKeywords),
      isActive: dto.isActive ?? true,
      category,
    });

    const saved = await this.productsRepository.save(product);
    const withCategory = await this.productsRepository.findOne({
      where: { id: saved.id },
      relations: ['category'],
    });

    await this.realtimeEventsService.emit('catalog.product.created', {
      product: withCategory ?? saved,
    });

    return withCategory ?? saved;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Urun bulunamadi.');
    }

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productsRepository.findOne({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException('Bu SKU zaten kullaniliyor.');
      }
    }

    if (dto.barcode !== undefined) {
      const normalizedBarcode = this.toNullable(dto.barcode);
      if (normalizedBarcode && normalizedBarcode !== product.barcode) {
        const existing = await this.productsRepository.findOne({
          where: { barcode: normalizedBarcode },
        });
        if (existing) {
          throw new ConflictException('Bu barkod zaten kullaniliyor.');
        }
      }
      product.barcode = normalizedBarcode;
    }

    let category = product.category;
    if (dto.categoryId !== undefined) {
      if (!dto.categoryId) {
        category = null;
      } else {
        const found = await this.categoriesRepository.findOne({
          where: { id: dto.categoryId },
        });
        if (!found) {
          throw new NotFoundException('Kategori bulunamadi.');
        }
        category = found;
      }
    }

    if (dto.name !== undefined) {
      product.name = dto.name;
    }

    if (dto.slug !== undefined) {
      product.slug = await this.generateUniqueProductSlug(dto.slug, id);
    } else if (dto.name !== undefined) {
      product.slug = await this.generateUniqueProductSlug(dto.name, id);
    }

    if (dto.sku !== undefined) {
      product.sku = dto.sku;
    }
    if (dto.brand !== undefined) {
      product.brand = this.toNullable(dto.brand);
    }

    if (dto.compareAtPrice !== undefined) {
      product.compareAtPrice =
        dto.compareAtPrice !== null ? dto.compareAtPrice.toFixed(2) : null;
    }
    if (dto.costPrice !== undefined) {
      product.costPrice = dto.costPrice !== null ? dto.costPrice.toFixed(2) : null;
    }
    if (dto.taxRate !== undefined) {
      product.taxRate = dto.taxRate.toFixed(2);
    }
    if (dto.vatIncluded !== undefined) {
      product.vatIncluded = dto.vatIncluded;
    }
    if (dto.minStock !== undefined) {
      product.minStock = dto.minStock;
    }
    if (dto.weight !== undefined) {
      product.weight = dto.weight !== null ? dto.weight.toFixed(3) : null;
    }
    if (dto.width !== undefined) {
      product.width = dto.width !== null ? dto.width.toFixed(2) : null;
    }
    if (dto.height !== undefined) {
      product.height = dto.height !== null ? dto.height.toFixed(2) : null;
    }
    if (dto.length !== undefined) {
      product.length = dto.length !== null ? dto.length.toFixed(2) : null;
    }
    if (dto.shortDescription !== undefined) {
      product.shortDescription = this.toNullable(dto.shortDescription);
    }
    if (dto.description !== undefined) {
      product.description = this.toNullable(dto.description);
    }
    if (dto.tags !== undefined) {
      product.tags = this.normalizeStringArray(dto.tags);
    }
    if (dto.images !== undefined) {
      product.images = this.normalizeStringArray(dto.images);
    }
    if (dto.featuredImage !== undefined || dto.images !== undefined) {
      const preferredFeaturedImage =
        dto.featuredImage !== undefined
          ? dto.featuredImage
          : product.featuredImage ?? undefined;
      product.featuredImage = this.pickFeaturedImage(
        product.images,
        preferredFeaturedImage,
      );
    }
    if (dto.variants !== undefined) {
      const normalizedVariants = this.normalizeVariants(dto.variants);
      product.variants = normalizedVariants;
      if (dto.hasVariants === undefined) {
        product.hasVariants = normalizedVariants.length > 0;
      }
    }
    if (dto.hasVariants !== undefined) {
      product.hasVariants = dto.hasVariants;
      if (!dto.hasVariants) {
        product.variants = [];
      }
    }
    const fallbackStock =
      dto.stock !== undefined ? dto.stock : Number(product.stock ?? 0);
    product.stock = this.resolveProductStock(
      fallbackStock,
      product.hasVariants,
      product.variants,
    );
    if (dto.seoTitle !== undefined) {
      product.seoTitle = this.toNullable(dto.seoTitle);
    }
    if (dto.seoDescription !== undefined) {
      product.seoDescription = this.toNullable(dto.seoDescription);
    }
    if (dto.seoKeywords !== undefined) {
      product.seoKeywords = this.normalizeStringArray(dto.seoKeywords);
    }
    if (dto.isActive !== undefined) {
      product.isActive = dto.isActive;
    }
    product.category = category;

    const pricingPolicy = this.normalizePricingPolicy(
      dto.pricingPolicy,
      product.pricingPolicy,
    );
    const expenseItems =
      dto.expenseItems !== undefined
        ? this.normalizeExpenseItems(dto.expenseItems)
        : this.normalizeExpenseItems(product.expenseItems);
    const costPriceValue =
      dto.costPrice !== undefined
        ? dto.costPrice ?? 0
        : Number(product.costPrice ?? 0);
    const taxRateValue =
      dto.taxRate !== undefined ? dto.taxRate : Number(product.taxRate ?? 0);
    const vatIncludedValue =
      dto.vatIncluded !== undefined ? dto.vatIncluded : product.vatIncluded;
    const requestedPrice =
      dto.price !== undefined ? dto.price : Number(product.price ?? 0);

    const initialPricingSummary = this.calculatePricingSummary({
      costPrice: costPriceValue,
      taxRate: taxRateValue,
      vatIncluded: vatIncludedValue,
      pricingPolicy,
      expenseItems,
      currentSalePrice: requestedPrice,
    });

    const resolvedPrice = dto.autoPriceFromPolicy
      ? initialPricingSummary.suggestedSalePrice
      : requestedPrice;

    const pricingSummary = this.calculatePricingSummary({
      costPrice: costPriceValue,
      taxRate: taxRateValue,
      vatIncluded: vatIncludedValue,
      pricingPolicy,
      expenseItems,
      currentSalePrice: resolvedPrice,
    });

    product.price = resolvedPrice.toFixed(2);
    product.pricingPolicy = pricingPolicy;
    product.expenseItems = expenseItems;
    product.pricingSummary = pricingSummary;

    const saved = await this.productsRepository.save(product);
    const withCategory = await this.productsRepository.findOne({
      where: { id: saved.id },
      relations: ['category'],
    });

    await this.realtimeEventsService.emit('catalog.product.updated', {
      product: withCategory ?? saved,
    });

    return withCategory ?? saved;
  }

  private async resolveCategory(categoryId?: string) {
    if (!categoryId) {
      return null;
    }

    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Kategori bulunamadi.');
    }

    return category;
  }

  private toNullable(value?: string): string | null {
    if (value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeStringArray(values?: string[]) {
    if (!values) {
      return [];
    }

    return values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  private pickFeaturedImage(images: string[], requested?: string) {
    if (images.length === 0) {
      return null;
    }

    const preferred = this.toNullable(requested);
    if (preferred && images.includes(preferred)) {
      return preferred;
    }

    return images[0];
  }

  private normalizeVariants(variants?: ProductVariant[]) {
    if (!variants) {
      return [];
    }

    return variants.map((variant) => ({
      title: variant.title.trim(),
      sku: variant.sku.trim(),
      price: Number(variant.price),
      stock: Number(variant.stock),
      optionOne: this.toNullable(variant.optionOne ?? undefined) ?? undefined,
      optionTwo: this.toNullable(variant.optionTwo ?? undefined) ?? undefined,
      optionThree:
        this.toNullable(variant.optionThree ?? undefined) ?? undefined,
      isDefault: Boolean(variant.isDefault),
    }));
  }

  private resolveProductStock(
    fallbackStock: number,
    hasVariants: boolean,
    variants: ProductVariant[],
  ) {
    if (hasVariants && variants.length > 0) {
      return variants.reduce((total, variant) => total + Number(variant.stock ?? 0), 0);
    }

    return Math.max(0, Number(fallbackStock ?? 0));
  }

  private normalizePricingPolicy(
    policy?: Partial<ProductPricingPolicy>,
    fallback?: ProductPricingPolicy,
  ): ProductPricingPolicy {
    const base = fallback ?? DEFAULT_PRICING_POLICY;

    return {
      targetMarginPercent: this.clampPercent(
        policy?.targetMarginPercent ?? base.targetMarginPercent,
      ),
      platformCommissionPercent: this.clampPercent(
        policy?.platformCommissionPercent ?? base.platformCommissionPercent,
      ),
      paymentFeePercent: this.clampPercent(
        policy?.paymentFeePercent ?? base.paymentFeePercent,
      ),
      marketingPercent: this.clampPercent(
        policy?.marketingPercent ?? base.marketingPercent,
      ),
      operationalPercent: this.clampPercent(
        policy?.operationalPercent ?? base.operationalPercent,
      ),
      discountBufferPercent: this.clampPercent(
        policy?.discountBufferPercent ?? base.discountBufferPercent,
      ),
      packagingCost: this.normalizeAmount(
        policy?.packagingCost ?? base.packagingCost,
      ),
      shippingCost: this.normalizeAmount(
        policy?.shippingCost ?? base.shippingCost,
      ),
      fixedCost: this.normalizeAmount(policy?.fixedCost ?? base.fixedCost),
    };
  }

  private normalizeExpenseItems(values?: ProductExpenseItem[]) {
    if (!values) {
      return [];
    }

    return values
      .map((item) => ({
        name: item.name.trim(),
        amount: this.normalizeAmount(item.amount),
      }))
      .filter((item) => item.name.length > 0 && item.amount >= 0);
  }

  private calculatePricingSummary(input: PricingInput): ProductPricingSummary {
    const unitCost = this.normalizeAmount(input.costPrice);
    const taxRate = this.clampPercent(input.taxRate);
    const fixedExpenseTotal = this.roundToTwo(
      input.pricingPolicy.packagingCost +
        input.pricingPolicy.shippingCost +
        input.pricingPolicy.fixedCost +
        input.expenseItems.reduce((sum, item) => sum + item.amount, 0),
    );

    const variableExpensePercent = this.roundToTwo(
      input.pricingPolicy.platformCommissionPercent +
        input.pricingPolicy.paymentFeePercent +
        input.pricingPolicy.marketingPercent +
        input.pricingPolicy.operationalPercent +
        input.pricingPolicy.discountBufferPercent,
    );

    const baseCost = unitCost + fixedExpenseTotal;
    const variableDenominator = Math.max(0.01, 1 - variableExpensePercent / 100);
    const minimumNetPrice = this.roundToTwo(baseCost / variableDenominator);

    const marginDenominator = Math.max(
      0.01,
      1 - input.pricingPolicy.targetMarginPercent / 100,
    );
    const suggestedNetPrice = this.roundToTwo(minimumNetPrice / marginDenominator);

    const suggestedSalePrice = this.roundToTwo(
      input.vatIncluded
        ? suggestedNetPrice * (1 + taxRate / 100)
        : suggestedNetPrice,
    );

    const salePrice = this.normalizeAmount(input.currentSalePrice);
    const netSalePrice = input.vatIncluded
      ? salePrice / (1 + taxRate / 100)
      : salePrice;
    const variableCostAtSale =
      netSalePrice * (variableExpensePercent / 100);
    const estimatedProfit = this.roundToTwo(
      netSalePrice - (baseCost + variableCostAtSale),
    );
    const estimatedMarginPercent = this.roundToTwo(
      netSalePrice > 0 ? (estimatedProfit / netSalePrice) * 100 : 0,
    );

    return {
      unitCost: this.roundToTwo(unitCost),
      fixedExpenseTotal,
      variableExpensePercent,
      minimumNetPrice,
      suggestedNetPrice,
      suggestedSalePrice,
      estimatedProfit,
      estimatedMarginPercent,
    };
  }

  private normalizeAmount(value: number) {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return this.roundToTwo(Math.max(0, value));
  }

  private clampPercent(value: number) {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return this.roundToTwo(Math.min(Math.max(0, value), 95));
  }

  private roundToTwo(value: number) {
    return Number(value.toFixed(2));
  }

  private slugify(value: string, fallback: string) {
    const transliterated = value
      .replace(/[Çç]/g, 'c')
      .replace(/[Ğğ]/g, 'g')
      .replace(/[İIıi]/g, 'i')
      .replace(/[Öö]/g, 'o')
      .replace(/[Şş]/g, 's')
      .replace(/[Üü]/g, 'u');

    const slug = transliterated
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || fallback;
  }

  private async generateUniqueCategorySlug(baseValue: string, currentId?: string) {
    const baseSlug = this.slugify(baseValue, 'kategori');
    let candidate = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await this.categoriesRepository.findOne({
        where: { slug: candidate },
      });

      if (!existing || existing.id === currentId) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  private async generateUniqueProductSlug(baseValue: string, currentId?: string) {
    const baseSlug = this.slugify(baseValue, 'urun');
    let candidate = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await this.productsRepository.findOne({
        where: { slug: candidate },
      });

      if (!existing || existing.id === currentId) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }
}

