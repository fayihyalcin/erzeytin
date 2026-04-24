import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LANDING_PAGE_STATUSES } from '../landing-page.constants';

class LandingPagePackageDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  originalPrice: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  highlight?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

class LandingPageInfoCardDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsArray()
  @IsString({ each: true })
  items: string[];
}

class LandingPageFaqItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  question: string;

  @IsString()
  @MinLength(2)
  answer: string;
}

class LandingPageReviewDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  initials?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(2)
  comment: string;
}

class LandingPageFooterLinkDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  label: string;

  @IsString()
  @MinLength(1)
  href: string;
}

class LandingPageConfigDto {
  @IsString()
  @MinLength(2)
  announcementTitle: string;

  @IsString()
  @MinLength(2)
  announcementSubtitle: string;

  @IsArray()
  @IsString({ each: true })
  stepLabels: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  visitorCount: number;

  @IsString()
  @MinLength(1)
  visitorLabel: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockCount: number;

  @IsString()
  @MinLength(1)
  stockLabel: string;

  @IsString()
  @MinLength(2)
  packageSectionTitle: string;

  @IsString()
  @MinLength(2)
  orderSectionTitle: string;

  @IsString()
  @MinLength(2)
  addressPlaceholder: string;

  @IsString()
  @MinLength(2)
  paymentSectionTitle: string;

  @IsString()
  @MinLength(2)
  orderButtonLabel: string;

  @IsString()
  @MinLength(2)
  stickyButtonLabel: string;

  @IsString()
  @MinLength(2)
  termsLabel: string;

  @IsString()
  @MinLength(2)
  productInfoTitle: string;

  @IsString()
  @MinLength(2)
  productInfoDescription: string;

  @IsArray()
  @IsString({ each: true })
  trustBadges: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LandingPageInfoCardDto)
  infoCards: LandingPageInfoCardDto[];

  @IsString()
  @MinLength(2)
  faqTitle: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LandingPageFaqItemDto)
  faqItems: LandingPageFaqItemDto[];

  @IsString()
  @MinLength(2)
  reviewsTitle: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LandingPageReviewDto)
  reviews: LandingPageReviewDto[];

  @IsString()
  @MinLength(2)
  footerSellerText: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LandingPageFooterLinkDto)
  footerLinks: LandingPageFooterLinkDto[];

  @IsArray()
  @IsString({ each: true })
  galleryImages: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LandingPagePackageDto)
  packages: LandingPagePackageDto[];
}

export class CreateLandingPageDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsIn(LANDING_PAGE_STATUSES)
  status?: (typeof LANDING_PAGE_STATUSES)[number];

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ValidateNested()
  @Type(() => LandingPageConfigDto)
  config: LandingPageConfigDto;
}

export {
  LandingPageConfigDto,
  LandingPageFaqItemDto,
  LandingPageFooterLinkDto,
  LandingPageInfoCardDto,
  LandingPagePackageDto,
  LandingPageReviewDto,
};
