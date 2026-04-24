import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { LandingPageStatus } from './landing-page.constants';

export interface LandingPagePackage {
  id: string;
  title: string;
  subtitle: string;
  note?: string;
  badge?: string;
  originalPrice: number;
  price: number;
  quantity: number;
  highlight?: string;
  isDefault?: boolean;
}

export interface LandingPageInfoCard {
  id: string;
  icon: string;
  title: string;
  items: string[];
}

export interface LandingPageFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LandingPageReview {
  id: string;
  name: string;
  initials: string;
  rating: number;
  comment: string;
}

export interface LandingPageFooterLink {
  id: string;
  label: string;
  href: string;
}

export interface LandingPageConfig {
  announcementTitle: string;
  announcementSubtitle: string;
  stepLabels: string[];
  visitorCount: number;
  visitorLabel: string;
  stockCount: number;
  stockLabel: string;
  packageSectionTitle: string;
  orderSectionTitle: string;
  addressPlaceholder: string;
  paymentSectionTitle: string;
  orderButtonLabel: string;
  stickyButtonLabel: string;
  termsLabel: string;
  productInfoTitle: string;
  productInfoDescription: string;
  trustBadges: string[];
  infoCards: LandingPageInfoCard[];
  faqTitle: string;
  faqItems: LandingPageFaqItem[];
  reviewsTitle: string;
  reviews: LandingPageReview[];
  footerSellerText: string;
  footerLinks: LandingPageFooterLink[];
  galleryImages: string[];
  packages: LandingPagePackage[];
}

@Entity('landing_pages')
export class LandingPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ default: 'DRAFT' })
  status: LandingPageStatus;

  @Column({ name: 'featured_image', type: 'text', nullable: true })
  featuredImage: string | null;

  @Column({ name: 'seo_title', type: 'text', nullable: true })
  seoTitle: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  config: LandingPageConfig;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
