import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const emptyArrayJson = sql`'[]'::jsonb`;
const emptyObjectJson = sql`'{}'::jsonb`;
const defaultPricingPolicyJson = sql`'{"fixedCost":0,"shippingCost":0,"packagingCost":0,"marketingPercent":0,"paymentFeePercent":0,"operationalPercent":0,"targetMarginPercent":30,"discountBufferPercent":0,"platformCommissionPercent":0}'::jsonb`;
const defaultPricingSummaryJson = sql`'{"unitCost":0,"estimatedProfit":0,"minimumNetPrice":0,"fixedExpenseTotal":0,"suggestedNetPrice":0,"suggestedSalePrice":0,"estimatedMarginPercent":0,"variableExpensePercent":0}'::jsonb`;

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  username: varchar('username').notNull().unique(),
  fullName: text('full_name').default('').notNull(),
  passwordHash: varchar('password_hash').notNull(),
  role: varchar('role').default('ADMIN').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const settings = pgTable('settings', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  key: varchar('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  name: varchar('name').notNull(),
  slug: varchar('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  displayOrder: integer('display_order').default(0).notNull(),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: jsonb('seo_keywords').$type<string[]>().default(emptyArrayJson).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  name: varchar('name').notNull(),
  slug: text('slug').unique(),
  sku: varchar('sku').notNull().unique(),
  barcode: text('barcode').unique(),
  brand: text('brand'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric('compare_at_price', { precision: 10, scale: 2 }),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('20').notNull(),
  vatIncluded: boolean('vat_included').default(true).notNull(),
  stock: integer('stock').default(0).notNull(),
  minStock: integer('min_stock').default(0).notNull(),
  weight: numeric('weight', { precision: 10, scale: 3 }),
  width: numeric('width', { precision: 10, scale: 2 }),
  height: numeric('height', { precision: 10, scale: 2 }),
  length: numeric('length', { precision: 10, scale: 2 }),
  shortDescription: text('short_description'),
  description: text('description'),
  tags: jsonb('tags').$type<string[]>().default(emptyArrayJson).notNull(),
  images: jsonb('images').$type<string[]>().default(emptyArrayJson).notNull(),
  featuredImage: text('featured_image'),
  hasVariants: boolean('has_variants').default(false).notNull(),
  variants: jsonb('variants').$type<unknown[]>().default(emptyArrayJson).notNull(),
  pricingPolicy: jsonb('pricing_policy').$type<Record<string, unknown>>().default(defaultPricingPolicyJson).notNull(),
  expenseItems: jsonb('expense_items').$type<unknown[]>().default(emptyArrayJson).notNull(),
  pricingSummary: jsonb('pricing_summary').$type<Record<string, unknown>>().default(defaultPricingSummaryJson).notNull(),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: jsonb('seo_keywords').$type<string[]>().default(emptyArrayJson).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  orderNumber: varchar('order_number').notNull().unique(),
  customerName: varchar('customer_name').notNull(),
  customerEmail: varchar('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  shippingAddress: jsonb('shipping_address').$type<Record<string, unknown>>().notNull(),
  billingAddress: jsonb('billing_address').$type<Record<string, unknown>>(),
  items: jsonb('items').$type<unknown[]>().notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric('shipping_fee', { precision: 10, scale: 2 }).default('0').notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  grandTotal: numeric('grand_total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency').default('TRY').notNull(),
  status: varchar('status').default('NEW').notNull(),
  paymentStatus: varchar('payment_status').default('PENDING').notNull(),
  paymentMethod: varchar('payment_method').default('CARD').notNull(),
  paymentProvider: text('payment_provider'),
  paymentTransactionId: text('payment_transaction_id'),
  fulfillmentStatus: varchar('fulfillment_status').default('UNFULFILLED').notNull(),
  customerNote: text('customer_note'),
  adminNote: text('admin_note'),
  source: varchar('source').default('WEBSITE').notNull(),
  assignedRepresentativeId: uuid('assigned_representative_id').references(() => adminUsers.id, {
    onDelete: 'set null',
  }),
  assignmentNote: text('assignment_note'),
  assignedAt: timestamp('assigned_at'),
  shippingMethod: text('shipping_method'),
  shippingCompany: text('shipping_company'),
  trackingNumber: text('tracking_number'),
  trackingUrl: text('tracking_url'),
  stockDeducted: boolean('stock_deducted').default(true).notNull(),
  placedAt: timestamp('placed_at').defaultNow().notNull(),
  paidAt: timestamp('paid_at'),
  confirmedAt: timestamp('confirmed_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderActivities = pgTable('order_activities', {
  id: uuid('id').default(sql`uuid_generate_v4()`).primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  actorUsername: text('actor_username'),
  eventType: text('event_type').notNull(),
  message: text('message').notNull(),
  meta: jsonb('meta').$type<Record<string, unknown>>().default(emptyObjectJson).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
