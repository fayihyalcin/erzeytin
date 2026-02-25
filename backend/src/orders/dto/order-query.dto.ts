import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

const ORDER_STATUSES = [
  'NEW',
  'CONFIRMED',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;

const PAYMENT_METHODS = [
  'CARD',
  'CASH_ON_DELIVERY',
  'BANK_TRANSFER',
  'EFT_HAVALE',
  'PAYPAL',
  'OTHER',
] as const;

const FULFILLMENT_STATUSES = [
  'UNFULFILLED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
] as const;

export class OrderQueryDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: (typeof PAYMENT_STATUSES)[number];

  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsIn(FULFILLMENT_STATUSES)
  fulfillmentStatus?: (typeof FULFILLMENT_STATUSES)[number];

  @IsOptional()
  @IsUUID()
  assignedRepresentativeId?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  mine?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
