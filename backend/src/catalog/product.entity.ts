import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

export interface ProductVariant {
  title: string;
  sku: string;
  price: number;
  stock: number;
  optionOne?: string;
  optionTwo?: string;
  optionThree?: string;
  isDefault?: boolean;
}

export interface ProductPricingPolicy {
  targetMarginPercent: number;
  platformCommissionPercent: number;
  paymentFeePercent: number;
  marketingPercent: number;
  operationalPercent: number;
  discountBufferPercent: number;
  packagingCost: number;
  shippingCost: number;
  fixedCost: number;
}

export interface ProductExpenseItem {
  name: string;
  amount: number;
}

export interface ProductPricingSummary {
  unitCost: number;
  fixedExpenseTotal: number;
  variableExpensePercent: number;
  minimumNetPrice: number;
  suggestedNetPrice: number;
  suggestedSalePrice: number;
  estimatedProfit: number;
  estimatedMarginPercent: number;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', unique: true, nullable: true })
  slug: string | null;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'text', unique: true, nullable: true })
  barcode: string | null;

  @Column({ type: 'text', nullable: true })
  brand: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: string;

  @Column({
    name: 'compare_at_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  compareAtPrice: string | null;

  @Column({
    name: 'cost_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  costPrice: string | null;

  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 2, default: 20 })
  taxRate: string;

  @Column({ name: 'vat_included', default: true })
  vatIncluded: boolean;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'min_stock', type: 'int', default: 0 })
  minStock: number;

  @Column({ type: 'numeric', precision: 10, scale: 3, nullable: true })
  weight: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  width: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  height: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  length: string | null;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  images: string[];

  @Column({ name: 'featured_image', type: 'text', nullable: true })
  featuredImage: string | null;

  @Column({ name: 'has_variants', default: false })
  hasVariants: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  variants: ProductVariant[];

  @Column({
    name: 'pricing_policy',
    type: 'jsonb',
    default: () =>
      "'{\"targetMarginPercent\":30,\"platformCommissionPercent\":0,\"paymentFeePercent\":0,\"marketingPercent\":0,\"operationalPercent\":0,\"discountBufferPercent\":0,\"packagingCost\":0,\"shippingCost\":0,\"fixedCost\":0}'",
  })
  pricingPolicy: ProductPricingPolicy;

  @Column({ name: 'expense_items', type: 'jsonb', default: () => "'[]'" })
  expenseItems: ProductExpenseItem[];

  @Column({
    name: 'pricing_summary',
    type: 'jsonb',
    default: () =>
      "'{\"unitCost\":0,\"fixedExpenseTotal\":0,\"variableExpensePercent\":0,\"minimumNetPrice\":0,\"suggestedNetPrice\":0,\"suggestedSalePrice\":0,\"estimatedProfit\":0,\"estimatedMarginPercent\":0}'",
  })
  pricingSummary: ProductPricingSummary;

  @Column({ name: 'seo_title', type: 'text', nullable: true })
  seoTitle: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ name: 'seo_keywords', type: 'jsonb', default: () => "'[]'" })
  seoKeywords: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
