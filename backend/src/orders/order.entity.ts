import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from '../users/admin-user.entity';
import { OrderActivity } from './order-activity.entity';

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentMethod =
  | 'CARD'
  | 'CASH_ON_DELIVERY'
  | 'BANK_TRANSFER'
  | 'EFT_HAVALE'
  | 'PAYPAL'
  | 'OTHER';

export type FulfillmentStatus =
  | 'UNFULFILLED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED';

export interface OrderItem {
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
  variantTitle?: string;
}

export interface OrderAddress {
  fullName: string;
  phone?: string;
  country: string;
  city: string;
  district?: string;
  postalCode?: string;
  line1: string;
  line2?: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_email' })
  customerEmail: string;

  @Column({ name: 'customer_phone', type: 'text', nullable: true })
  customerPhone: string | null;

  @Column({ name: 'shipping_address', type: 'jsonb' })
  shippingAddress: OrderAddress;

  @Column({ name: 'billing_address', type: 'jsonb', nullable: true })
  billingAddress: OrderAddress | null;

  @Column({ type: 'jsonb' })
  items: OrderItem[];

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: string;

  @Column({
    name: 'shipping_fee',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  shippingFee: string;

  @Column({
    name: 'discount_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount: string;

  @Column({
    name: 'tax_amount',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  taxAmount: string;

  @Column({ name: 'grand_total', type: 'numeric', precision: 10, scale: 2 })
  grandTotal: string;

  @Column({ default: 'TRY' })
  currency: string;

  @Column({ default: 'NEW' })
  status: OrderStatus;

  @Column({ name: 'payment_status', default: 'PENDING' })
  paymentStatus: PaymentStatus;

  @Column({ name: 'payment_method', default: 'CARD' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_provider', type: 'text', nullable: true })
  paymentProvider: string | null;

  @Column({ name: 'payment_transaction_id', type: 'text', nullable: true })
  paymentTransactionId: string | null;

  @Column({ name: 'fulfillment_status', default: 'UNFULFILLED' })
  fulfillmentStatus: FulfillmentStatus;

  @Column({ name: 'customer_note', type: 'text', nullable: true })
  customerNote: string | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ default: 'WEBSITE' })
  source: string;

  @Column({ name: 'assigned_representative_id', type: 'uuid', nullable: true })
  assignedRepresentativeId: string | null;

  @ManyToOne(() => AdminUser, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_representative_id' })
  assignedRepresentative: AdminUser | null;

  @Column({ name: 'assignment_note', type: 'text', nullable: true })
  assignmentNote: string | null;

  @Column({ name: 'assigned_at', type: 'timestamp', nullable: true })
  assignedAt: Date | null;

  @Column({ name: 'shipping_method', type: 'text', nullable: true })
  shippingMethod: string | null;

  @Column({ name: 'shipping_company', type: 'text', nullable: true })
  shippingCompany: string | null;

  @Column({ name: 'tracking_number', type: 'text', nullable: true })
  trackingNumber: string | null;

  @Column({ name: 'tracking_url', type: 'text', nullable: true })
  trackingUrl: string | null;

  @Column({ name: 'stock_deducted', default: true })
  stockDeducted: boolean;

  @CreateDateColumn({ name: 'placed_at' })
  placedAt: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @OneToMany(() => OrderActivity, (activity) => activity.order)
  activities: OrderActivity[];

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
