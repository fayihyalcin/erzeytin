import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const LANDING_ORDER_PAYMENT_METHODS = [
  'PAYTR',
  'CASH_ON_DELIVERY',
  'CARD_ON_DELIVERY',
] as const;

export class CreateLandingOrderDto {
  @IsString()
  @MinLength(2)
  customerName: string;

  @IsString()
  @MinLength(5)
  customerPhone: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @MinLength(2)
  packageId: string;

  @IsIn(LANDING_ORDER_PAYMENT_METHODS)
  paymentMethod: (typeof LANDING_ORDER_PAYMENT_METHODS)[number];

  @Type(() => Boolean)
  @IsBoolean()
  termsAccepted: boolean;

  @IsOptional()
  @IsObject()
  tracking?: Record<string, unknown>;
}
