import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, value) => value !== '')
  @IsEmail()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsString()
  websiteConfig?: string;

  @IsOptional()
  @IsString()
  blogPosts?: string;

  @IsOptional()
  @IsString()
  mediaLibrary?: string;

  @IsOptional()
  @IsString()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  apiBaseUrl?: string;

  @IsOptional()
  @IsString()
  paytrEnabled?: string;

  @IsOptional()
  @IsString()
  paytrMerchantId?: string;

  @IsOptional()
  @IsString()
  paytrMerchantKey?: string;

  @IsOptional()
  @IsString()
  paytrMerchantSalt?: string;

  @IsOptional()
  @IsString()
  paytrTestMode?: string;

  @IsOptional()
  @IsString()
  paytrDebugOn?: string;

  @IsOptional()
  @IsString()
  paytrNoInstallment?: string;

  @IsOptional()
  @IsString()
  paytrMaxInstallment?: string;

  @IsOptional()
  @IsString()
  paytrTimeoutLimit?: string;

  @IsOptional()
  @IsString()
  paytrLang?: string;
}
