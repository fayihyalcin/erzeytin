import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../users/admin-user.entity';
import { Setting } from '../settings/setting.entity';
import { Category } from '../catalog/category.entity';
import { Product } from '../catalog/product.entity';

const DEFAULT_WEBSITE_CONFIG = JSON.stringify({
  theme: {
    brandName: 'Er Zeytin',
    tagline: 'Egeden Sofrana Dogal Lezzet',
    adminButtonLabel: 'Admin Giris',
  },
  announcement: 'Yeni hasat soguk sikim zeytinyaglari stokta.',
  navItems: [
    { label: 'Ana Sayfa', href: '#hero' },
    { label: 'Kategoriler', href: '#categories' },
    { label: 'Urunler', href: '#products' },
    { label: 'Kampanyalar', href: '#campaigns' },
    { label: 'Iletisim', href: '#footer' },
  ],
  heroSlides: [
    {
      badge: 'Yeni Hasat',
      title: 'Erken Hasat Sizma Zeytinyagi',
      subtitle: 'Tas degirmen - soguk sikim',
      description:
        'Ayvalik ve Memecik zeytinlerinden uretilen premium seriyi hemen kesfedin.',
      ctaLabel: 'Urunleri Kesfet',
      ctaHref: '#products',
      imageUrl:
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1400&q=80',
    },
    {
      badge: 'Sinirli Seri',
      title: 'Gurme Tadim Paketi',
      subtitle: '3 farkli yoresel aroma',
      description:
        'Limon kabugu, kekik ve klasik naturel sizma cesitleri tek kutuda.',
      ctaLabel: 'Paketi Incele',
      ctaHref: '#products',
      imageUrl:
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1400&q=80',
    },
  ],
  promoCards: [
    {
      title: '3 Al 2 Ode',
      subtitle: '500ml cam sise serilerinde gecerli',
      ctaLabel: 'Kampanyayi Ac',
      ctaHref: '#products',
      imageUrl:
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1000&q=80',
    },
    {
      title: 'Kurumsal Tedarik',
      subtitle: 'Restoran ve cafe ozel fiyatlari',
      ctaLabel: 'Teklif Al',
      ctaHref: '#footer',
      imageUrl:
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1000&q=80',
    },
  ],
  featureItems: [
    {
      icon: 'truck',
      title: 'Hizli Kargo',
      description: 'Saat 14:00e kadar verilen siparisler ayni gun kargoda.',
    },
    {
      icon: 'leaf',
      title: 'Dogal Uretim',
      description: 'Katkisiz, filtreli veya filtresiz naturel sizma secenekleri.',
    },
    {
      icon: 'shield',
      title: 'Guvenli Odeme',
      description: '3D secure destekli guvenli online odeme altyapisi.',
    },
    {
      icon: 'gift',
      title: 'Hediye Paketi',
      description: 'Ozel kutu ve not karti ile gonderim secenekleri.',
    },
  ],
  newsletterTitle: 'Lezzet Bultenine Katilin',
  newsletterDescription:
    'Indirimler, yeni hasat duyurulari ve tarifler e-posta kutunuza gelsin.',
  footerColumns: [
    {
      title: 'Kurumsal',
      links: ['Hakkimizda', 'Uretim Sureci', 'Sertifikalar', 'Iletisim'],
    },
    {
      title: 'Musteri Hizmetleri',
      links: ['Sikca Sorulan Sorular', 'Kargo ve Teslimat', 'Iade Politikasi'],
    },
    {
      title: 'Hesabim',
      links: ['Siparislerim', 'Favorilerim', 'Adres Bilgilerim'],
    },
  ],
});

const DEFAULT_PRODUCT_PRICING_POLICY = {
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

const DEFAULT_PRODUCT_PRICING_SUMMARY = {
  unitCost: 0,
  fixedExpenseTotal: 0,
  variableExpensePercent: 0,
  minimumNetPrice: 0,
  suggestedNetPrice: 0,
  suggestedSalePrice: 0,
  estimatedProfit: 0,
  estimatedMarginPercent: 0,
};

const SAMPLE_CATEGORIES = [
  {
    name: 'Sizma Zeytinyagi',
    slug: 'sizma-zeytinyagi',
    description: 'Erken hasat ve olgun hasat naturel sizma zeytinyagi cesitleri.',
    imageUrl:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1400&q=80',
    displayOrder: 1,
    seoKeywords: ['zeytinyagi', 'sizma', 'erken hasat'],
  },
  {
    name: 'Gemlik Siyah Zeytin',
    slug: 'gemlik-siyah-zeytin',
    description: 'Kahvaltilik, sele ve salamura siyah zeytin urunleri.',
    imageUrl:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1400&q=80',
    displayOrder: 2,
    seoKeywords: ['siyah zeytin', 'gemlik', 'kahvaltilik'],
  },
  {
    name: 'Yesil Zeytin',
    slug: 'yesil-zeytin',
    description: 'Kirilmis, cizik ve dolmalik yesil zeytin cesitleri.',
    imageUrl:
      'https://images.unsplash.com/photo-1593001874117-c99c800e3eb5?auto=format&fit=crop&w=1400&q=80',
    displayOrder: 3,
    seoKeywords: ['yesil zeytin', 'kirilmis', 'cizik'],
  },
] as const;

const SAMPLE_PRODUCTS = [
  {
    name: 'Erken Hasat Sizma Zeytinyagi 5 Litre Teneke',
    slug: 'erken-hasat-sizma-zeytinyagi-5-litre-teneke',
    sku: 'ERZ-ZYT-5LT-001',
    barcode: '8690000005001',
    brand: 'Er Zeytin',
    price: '1299.90',
    compareAtPrice: '1449.90',
    costPrice: '899.00',
    stock: 36,
    minStock: 8,
    weight: '5.000',
    shortDescription: 'Yuksek polifenol degerli premium erken hasat sizma zeytinyagi.',
    description:
      'Ayvalik zeytinlerinden soguk sikim yontemiyle uretilen 5 litre ekonomik teneke ambalaj. Salata, soguk meze ve yemeklerde yogun aroma sunar.',
    tags: ['erken hasat', '5 litre', 'teneke', 'premium'],
    image:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'sizma-zeytinyagi',
  },
  {
    name: 'Naturel Sizma Zeytinyagi 1 Litre Cam Sise',
    slug: 'naturel-sizma-zeytinyagi-1-litre-cam-sise',
    sku: 'ERZ-ZYT-1LT-002',
    barcode: '8690000001002',
    brand: 'Er Zeytin',
    price: '349.90',
    compareAtPrice: '399.90',
    costPrice: '240.00',
    stock: 74,
    minStock: 12,
    weight: '1.000',
    shortDescription: 'Gunluk kullanim icin ideal cam sise naturel sizma zeytinyagi.',
    description:
      'Filtreli naturel sizma 1 litre cam sise. Taze meyvemsilik ve dengeli yakicilik profili ile mutfakta cok yonlu kullanim sunar.',
    tags: ['1 litre', 'cam sise', 'naturel sizma'],
    image:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'sizma-zeytinyagi',
  },
  {
    name: 'Naturel Birinci Zeytinyagi 2 Litre Pet',
    slug: 'naturel-birinci-zeytinyagi-2-litre-pet',
    sku: 'ERZ-ZYT-2LT-003',
    barcode: '8690000002003',
    brand: 'Er Zeytin',
    price: '529.90',
    compareAtPrice: '579.90',
    costPrice: '360.00',
    stock: 58,
    minStock: 10,
    weight: '2.000',
    shortDescription: 'Kizartma ve sicak yemekler icin uygun naturel birinci zeytinyagi.',
    description:
      '2 litre pet ambalajda ekonomik secenek. Dengeli aroma yapisi sayesinde sicak yemek ve gunluk mutfak kullanimina uygundur.',
    tags: ['2 litre', 'pet sise', 'naturel birinci'],
    image:
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'sizma-zeytinyagi',
  },
  {
    name: 'Gemlik Siyah Zeytin 1 Kg',
    slug: 'gemlik-siyah-zeytin-1-kg',
    sku: 'ERZ-SYZ-1KG-004',
    barcode: '8690000010004',
    brand: 'Er Zeytin',
    price: '279.90',
    compareAtPrice: '319.90',
    costPrice: '190.00',
    stock: 82,
    minStock: 15,
    weight: '1.000',
    shortDescription: 'Etli dokusu ve ince kabuklu yapisiyla kahvaltilik Gemlik siyah zeytin.',
    description:
      'Dogal salamura yontemiyle olgunlastirilan Gemlik tipi siyah zeytin. Kahvalti sofralari ve meze sunumlari icin uygundur.',
    tags: ['gemlik', 'siyah zeytin', '1 kg', 'kahvaltilik'],
    image:
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'gemlik-siyah-zeytin',
  },
  {
    name: 'Sele Siyah Zeytin 500 gr',
    slug: 'sele-siyah-zeytin-500-gr',
    sku: 'ERZ-SYZ-500G-005',
    barcode: '8690000005005',
    brand: 'Er Zeytin',
    price: '189.90',
    compareAtPrice: '214.90',
    costPrice: '126.00',
    stock: 67,
    minStock: 12,
    weight: '0.500',
    shortDescription: 'Daha yogun tat profiline sahip geleneksel sele siyah zeytin.',
    description:
      'Az tuzlu ve etli sele zeytin secenegi. Kahvalti tabaklari ve atistirmalik servisler icin idealdir.',
    tags: ['sele', 'siyah zeytin', '500 gr'],
    image:
      'https://images.unsplash.com/photo-1593001874117-c99c800e3eb5?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'gemlik-siyah-zeytin',
  },
  {
    name: 'Kirilmis Yesil Zeytin 900 gr',
    slug: 'kirilmis-yesil-zeytin-900-gr',
    sku: 'ERZ-YSZ-900G-006',
    barcode: '8690000009006',
    brand: 'Er Zeytin',
    price: '239.90',
    compareAtPrice: '269.90',
    costPrice: '165.00',
    stock: 59,
    minStock: 10,
    weight: '0.900',
    shortDescription: 'Limon ve dogal baharat notalari ile kirilmis yesil zeytin.',
    description:
      'Geleneksel usulde kirilarak hazirlanan yesil zeytin. Ferah aroma profili ile kahvalti ve salatalara uyumludur.',
    tags: ['yesil zeytin', 'kirilmis', '900 gr'],
    image:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'yesil-zeytin',
  },
  {
    name: 'Dolmalik Yesil Zeytin 700 gr',
    slug: 'dolmalik-yesil-zeytin-700-gr',
    sku: 'ERZ-YSZ-700G-007',
    barcode: '8690000007007',
    brand: 'Er Zeytin',
    price: '219.90',
    compareAtPrice: '249.90',
    costPrice: '151.00',
    stock: 51,
    minStock: 8,
    weight: '0.700',
    shortDescription: 'Iri taneli dolmalik yesil zeytin.',
    description:
      'Iri taneli secme dolmalik yesil zeytin. Peynir dolgulu sunumlar ve meze tabaklari icin uygundur.',
    tags: ['yesil zeytin', 'dolmalik', '700 gr'],
    image:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    categorySlug: 'yesil-zeytin',
  },
] as const;

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUsersRepository: Repository<AdminUser>,
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
    await this.seedRepresentative();
    await this.seedSettings();
    await this.seedCatalog();
  }

  private async seedAdmin() {
    const username = process.env.ADMIN_USERNAME ?? 'admin';
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';

    const existing = await this.adminUsersRepository.findOne({
      where: { username },
    });

    if (existing) {
      let shouldSave = false;
      if (!existing.fullName) {
        existing.fullName = 'Admin Kullanici';
        shouldSave = true;
      }
      if (existing.role !== 'ADMIN') {
        existing.role = 'ADMIN';
        shouldSave = true;
      }
      if (!existing.isActive) {
        existing.isActive = true;
        shouldSave = true;
      }

      if (shouldSave) {
        await this.adminUsersRepository.save(existing);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.adminUsersRepository.save(
      this.adminUsersRepository.create({
        username,
        fullName: 'Admin Kullanici',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      }),
    );

    this.logger.log(`Varsayilan admin olusturuldu: ${username}`);
  }

  private async seedRepresentative() {
    const username = process.env.REP_USERNAME ?? 'temsilci';
    const password = process.env.REP_PASSWORD ?? 'temsilci123';
    const fullName = process.env.REP_FULL_NAME ?? 'Musteri Temsilcisi';

    const existing = await this.adminUsersRepository.findOne({
      where: { username },
    });

    if (existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.adminUsersRepository.save(
      this.adminUsersRepository.create({
        username,
        fullName,
        passwordHash,
        role: 'REPRESENTATIVE',
        isActive: true,
      }),
    );

    this.logger.log(`Varsayilan temsilci olusturuldu: ${username}`);
  }

  private async seedSettings() {
    const defaults: Record<string, string> = {
      storeName: 'Zeytin Commerce',
      supportEmail: 'destek@zeytin.local',
      currency: 'TRY',
      timezone: 'Europe/Istanbul',
      taxRate: '20',
      websiteConfig: DEFAULT_WEBSITE_CONFIG,
    };

    await Promise.all(
      Object.entries(defaults).map(async ([key, value]) => {
        const existing = await this.settingsRepository.findOne({
          where: { key },
        });

        if (existing) {
          return;
        }

        await this.settingsRepository.save(
          this.settingsRepository.create({
            key,
            value,
          }),
        );
      }),
    );
  }

  private async seedCatalog() {
    const categoryMap = new Map<string, Category>();

    for (const category of SAMPLE_CATEGORIES) {
      let record = await this.categoriesRepository.findOne({
        where: { slug: category.slug },
      });

      if (!record) {
        record = await this.categoriesRepository.save(
          this.categoriesRepository.create({
            name: category.name,
            slug: category.slug,
            description: category.description,
            imageUrl: category.imageUrl,
            displayOrder: category.displayOrder,
            seoTitle: category.name,
            seoDescription: category.description,
            seoKeywords: [...category.seoKeywords],
            isActive: true,
          }),
        );
      }

      categoryMap.set(category.slug, record);
    }

    for (const product of SAMPLE_PRODUCTS) {
      const existingBySku = await this.productsRepository.findOne({
        where: { sku: product.sku },
      });

      if (existingBySku) {
        continue;
      }

      const slug = await this.resolveAvailableProductSlug(product.slug);
      const category = categoryMap.get(product.categorySlug) ?? null;

      await this.productsRepository.save(
        this.productsRepository.create({
          name: product.name,
          slug,
          sku: product.sku,
          barcode: product.barcode,
          brand: product.brand,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          costPrice: product.costPrice,
          taxRate: '10.00',
          vatIncluded: true,
          stock: product.stock,
          minStock: product.minStock,
          weight: product.weight,
          width: null,
          height: null,
          length: null,
          shortDescription: product.shortDescription,
          description: product.description,
          tags: [...product.tags],
          images: [product.image],
          featuredImage: product.image,
          hasVariants: false,
          variants: [],
          pricingPolicy: { ...DEFAULT_PRODUCT_PRICING_POLICY },
          expenseItems: [],
          pricingSummary: { ...DEFAULT_PRODUCT_PRICING_SUMMARY },
          seoTitle: product.name,
          seoDescription: product.shortDescription,
          seoKeywords: [...product.tags],
          isActive: true,
          category,
        }),
      );
    }
  }

  private async resolveAvailableProductSlug(baseSlug: string) {
    let candidate = baseSlug;
    let suffix = 2;

    while (candidate) {
      const existing = await this.productsRepository.findOne({
        where: { slug: candidate },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return null;
  }
}
