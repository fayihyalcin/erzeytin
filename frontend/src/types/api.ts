export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'REPRESENTATIVE';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

export interface SettingsDto {
  storeName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  taxRate: string;
  siteUrl: string;
  apiBaseUrl: string;
  paytrEnabled: string;
  paytrMerchantId: string;
  paytrMerchantKey: string;
  paytrMerchantSalt: string;
  paytrTestMode: string;
  paytrDebugOn: string;
  paytrNoInstallment: string;
  paytrMaxInstallment: string;
  paytrTimeoutLimit: string;
  paytrLang: string;
}

export interface WebsiteThemeConfig {
  brandName: string;
  tagline: string;
  adminButtonLabel: string;
}

export interface WebsiteNavItem {
  label: string;
  href: string;
}

export interface WebsiteHeroSlide {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  videoUrl: string;
  posterUrl: string;
}

export interface WebsitePromoCard {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
}

export interface WebsiteParallaxCard {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
}

export interface WebsiteFeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface WebsiteFooterLink {
  label: string;
  href: string;
}

export interface WebsiteFooterColumn {
  title: string;
  links: WebsiteFooterLink[];
}

export interface WebsiteRibbonConfig {
  eyebrow: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
}

export interface WebsiteContactInfo {
  phoneDisplay: string;
  phoneLink: string;
  whatsappLink: string;
  email: string;
  address: string;
  workingHours: string;
  mapsEmbedUrl: string;
}

export interface WebsiteHomeSections {
  hotDealsTitle: string;
  hotDealsDescription: string;
  featuredTitle: string;
  featuredDescription: string;
  bestSellersTitle: string;
  bestSellersDescription: string;
  popularTitle: string;
  popularDescription: string;
  blogTitle: string;
  blogDescription: string;
}

export interface WebsiteContactPageContent {
  badge: string;
  title: string;
  description: string;
  quickInfoTitle: string;
  mapTitle: string;
  mapDescription: string;
  formTitle: string;
  formDescription: string;
  footerDescription: string;
}

export interface WebsiteManagedPageContent {
  badge: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  mediaUrl: string;
  videoUrl: string;
  posterUrl: string;
  summaryTitle: string;
  summaryText: string;
  highlights: string[];
}

export interface WebsiteManagedPagesConfig {
  categories: WebsiteManagedPageContent;
  products: WebsiteManagedPageContent;
  campaigns: WebsiteManagedPageContent;
}

export interface WebsiteLegalSection {
  heading: string;
  body: string;
}

export interface WebsiteLegalDocument {
  title: string;
  subtitle: string;
  sections: WebsiteLegalSection[];
}

export interface WebsiteLegalPagesConfig {
  kvkk: WebsiteLegalDocument;
  privacy: WebsiteLegalDocument;
  sales: WebsiteLegalDocument;
}

export interface WebsiteConfig {
  theme: WebsiteThemeConfig;
  announcement: string;
  navItems: WebsiteNavItem[];
  heroSlides: WebsiteHeroSlide[];
  parallaxCards: WebsiteParallaxCard[];
  promoCards: WebsitePromoCard[];
  ribbon: WebsiteRibbonConfig;
  featureItems: WebsiteFeatureItem[];
  newsletterTitle: string;
  newsletterDescription: string;
  contact: WebsiteContactInfo;
  homeSections: WebsiteHomeSections;
  contactPage: WebsiteContactPageContent;
  pages: WebsiteManagedPagesConfig;
  legalPages: WebsiteLegalPagesConfig;
  footerColumns: WebsiteFooterColumn[];
}

export interface PublicSettingsDto extends Partial<SettingsDto> {
  websiteConfig?: string;
  blogPosts?: string;
  paytrEnabled?: string;
}

export type MediaItemType = 'image' | 'video' | 'document';

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: MediaItemType;
  folder: string;
  alt: string;
  description: string;
  thumbnailUrl: string;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  isActive: boolean;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
}

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

export interface Product {
  id: string;
  name: string;
  slug: string | null;
  sku: string;
  barcode: string | null;
  brand: string | null;
  price: string;
  compareAtPrice: string | null;
  costPrice: string | null;
  taxRate: string;
  vatIncluded: boolean;
  stock: number;
  minStock: number;
  weight: string | null;
  width: string | null;
  height: string | null;
  length: string | null;
  shortDescription: string | null;
  description: string | null;
  tags: string[];
  images: string[];
  featuredImage: string | null;
  hasVariants: boolean;
  variants: ProductVariant[];
  pricingPolicy: ProductPricingPolicy;
  expenseItems: ProductExpenseItem[];
  pricingSummary: ProductPricingSummary;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  isActive: boolean;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCatalogSummary {
  totalCount: number;
  activeCount: number;
  totalStock: number;
  lowStockCount: number;
  variantCount: number;
  lowStockProducts: Product[];
}

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  provider: string;
  merchantOid: string;
  status: PaymentStatus;
  requestAmount: string;
  paidAmount: string | null;
  currency: string;
  iframeToken: string | null;
  paymentType: string | null;
  providerTransactionId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  callbackCount: number;
  isTest: boolean;
  rawRequest: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
  rawCallback: Record<string, unknown>;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress | null;
  items: OrderItem[];
  subtotal: string;
  shippingFee: string;
  discountAmount: string;
  taxAmount: string;
  grandTotal: string;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentProvider: string | null;
  paymentTransactionId: string | null;
  paymentTransactions: PaymentTransaction[];
  fulfillmentStatus: FulfillmentStatus;
  customerNote: string | null;
  adminNote: string | null;
  source: string;
  assignedRepresentativeId: string | null;
  assignedRepresentative: AdminUser | null;
  assignmentNote: string | null;
  assignedAt: string | null;
  shippingMethod: string | null;
  shippingCompany: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  stockDeducted: boolean;
  placedAt: string;
  paidAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
}

export interface PaytrCheckoutSession {
  orderId: string;
  orderNumber: string;
  merchantOid: string;
  paymentId: string;
  iframeToken: string;
  iframeUrl: string;
}

export interface OrderActivity {
  id: string;
  orderId: string;
  actorId: string | null;
  actorUsername: string | null;
  actor: AdminUser | null;
  eventType: string;
  message: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface OrdersSummary {
  orderCount: number;
  totalRevenue: number;
  byStatus: Record<string, number>;
}

export interface CategoryCatalogSummary {
  totalCount: number;
  activeCount: number;
  imageCount: number;
  seoConfiguredCount: number;
}
