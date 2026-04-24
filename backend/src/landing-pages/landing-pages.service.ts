import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Brackets, Repository } from 'typeorm';
import { OrderActivity } from '../orders/order-activity.entity';
import { Order, type OrderItem, type PaymentMethod } from '../orders/order.entity';
import { sanitizeOrderTrackingPayload } from '../orders/order-tracking.utils';
import { PaytrService } from '../orders/paytr.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { CreateLandingOrderDto } from './dto/create-landing-order.dto';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { ListLandingPagesQueryDto } from './dto/list-landing-pages-query.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import {
  LandingPage,
  type LandingPageConfig,
  type LandingPageFaqItem,
  type LandingPageFooterLink,
  type LandingPageInfoCard,
  type LandingPagePackage,
  type LandingPageReview,
} from './landing-page.entity';

type PaytrClientContext = {
  ip: string;
  origin?: string;
  referer?: string;
  host?: string;
  protocol?: string;
};

@Injectable()
export class LandingPagesService {
  constructor(
    @InjectRepository(LandingPage)
    private readonly landingPagesRepository: Repository<LandingPage>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderActivity)
    private readonly orderActivitiesRepository: Repository<OrderActivity>,
    private readonly paytrService: PaytrService,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

  async findAll(query: ListLandingPagesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const queryBuilder = this.landingPagesRepository
      .createQueryBuilder('landingPage')
      .orderBy('landingPage.updatedAt', 'DESC');

    if (query.status) {
      queryBuilder.andWhere('landingPage.status = :status', { status: query.status });
    }

    if (query.search?.trim()) {
      const value = `%${query.search.trim()}%`;
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('landingPage.name ILIKE :value', { value })
            .orWhere('landingPage.slug ILIKE :value', { value })
            .orWhere('landingPage.seoTitle ILIKE :value', { value });
        }),
      );
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(id: string) {
    const landingPage = await this.landingPagesRepository.findOne({ where: { id } });
    if (!landingPage) {
      throw new NotFoundException('Landing page bulunamadi.');
    }

    return landingPage;
  }

  async create(dto: CreateLandingPageDto) {
    const slug = await this.generateUniqueSlug(dto.slug ?? dto.name);
    const entity = this.landingPagesRepository.create({
      name: dto.name.trim(),
      slug,
      status: dto.status ?? 'DRAFT',
      featuredImage: this.toNullable(dto.featuredImage),
      seoTitle: this.toNullable(dto.seoTitle),
      seoDescription: this.toNullable(dto.seoDescription),
      config: this.normalizeConfig(dto.name, dto.config as Partial<LandingPageConfig>),
      publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
    });

    const saved = await this.landingPagesRepository.save(entity);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateLandingPageDto) {
    const landingPage = await this.findOne(id);

    if (dto.name !== undefined) {
      landingPage.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      landingPage.slug = await this.generateUniqueSlug(dto.slug, landingPage.id);
    } else if (dto.name !== undefined) {
      landingPage.slug = await this.generateUniqueSlug(landingPage.name, landingPage.id);
    }

    if (dto.status !== undefined) {
      landingPage.status = dto.status;
      if (dto.status === 'PUBLISHED' && !landingPage.publishedAt) {
        landingPage.publishedAt = new Date();
      }
    }

    if (dto.featuredImage !== undefined) {
      landingPage.featuredImage = this.toNullable(dto.featuredImage);
    }

    if (dto.seoTitle !== undefined) {
      landingPage.seoTitle = this.toNullable(dto.seoTitle);
    }

    if (dto.seoDescription !== undefined) {
      landingPage.seoDescription = this.toNullable(dto.seoDescription);
    }

    if (dto.config !== undefined) {
      landingPage.config = this.normalizeConfig(landingPage.name, {
        ...landingPage.config,
        ...dto.config,
      } as Partial<LandingPageConfig>);
    } else {
      landingPage.config = this.normalizeConfig(landingPage.name, landingPage.config);
    }

    await this.landingPagesRepository.save(landingPage);
    return this.findOne(landingPage.id);
  }

  async delete(id: string) {
    const landingPage = await this.findOne(id);
    await this.landingPagesRepository.remove(landingPage);
    return { deleted: true, id };
  }

  async findPublicBySlug(slug: string) {
    const landingPage = await this.landingPagesRepository.findOne({
      where: { slug: slug.trim(), status: 'PUBLISHED' },
    });

    if (!landingPage) {
      throw new NotFoundException('Landing page bulunamadi.');
    }

    return landingPage;
  }

  async findLandingOrderByOrderNumber(orderNumber: string) {
    const order = await this.ordersRepository.findOne({
      where: { orderNumber, source: 'LANDING_PAGE' },
      relations: ['paymentTransactions', 'assignedRepresentative'],
    });

    if (!order) {
      throw new NotFoundException('Landing siparisi bulunamadi.');
    }

    return order;
  }

  async createManualOrder(slug: string, dto: CreateLandingOrderDto) {
    if (!dto.termsAccepted) {
      throw new BadRequestException('Siparisi onaylamak icin sozlesmeyi kabul etmelisiniz.');
    }

    const landingPage = await this.findPublicBySlug(slug);
    const selectedPackage = this.findPackageOrThrow(landingPage, dto.packageId);
    const order = await this.createLandingOrder(landingPage, selectedPackage, dto, {
      paymentMethod: this.toOrderPaymentMethod(dto.paymentMethod),
      paymentProvider: 'MANUAL',
      paymentStatus: 'PENDING',
    });

    return this.findLandingOrderByOrderNumber(order.orderNumber);
  }

  async createPaytrCheckout(
    slug: string,
    dto: CreateLandingOrderDto,
    context: PaytrClientContext,
  ) {
    if (!dto.termsAccepted) {
      throw new BadRequestException('Siparisi onaylamak icin sozlesmeyi kabul etmelisiniz.');
    }

    if (dto.paymentMethod !== 'PAYTR') {
      throw new BadRequestException('Online odeme icin PAYTR secimi yapmalisiniz.');
    }

    const landingPage = await this.findPublicBySlug(slug);
    const selectedPackage = this.findPackageOrThrow(landingPage, dto.packageId);
    const order = await this.createLandingOrder(landingPage, selectedPackage, dto, {
      paymentMethod: 'CARD',
      paymentProvider: 'PAYTR',
      paymentStatus: 'PENDING',
    });

    return this.paytrService.createCheckoutForExistingOrder(order.id, context, {
      returnPath: '/landing/paytr/return',
      failureMessagePrefix: 'Landing PAYTR iframe token alinamadi',
    });
  }

  private async createLandingOrder(
    landingPage: LandingPage,
    selectedPackage: LandingPagePackage,
    dto: CreateLandingOrderDto,
    payment: {
      paymentMethod: PaymentMethod;
      paymentProvider: string;
      paymentStatus: Order['paymentStatus'];
    },
  ) {
    const orderNumber = await this.generateOrderNumber();
    const shippingAddress = this.buildShippingAddress(dto.customerName, dto.customerPhone, dto.address);
    const syntheticEmail = this.buildSyntheticEmail(dto.customerPhone);
    const totalPrice = this.roundToTwo(selectedPackage.price);
    const tracking = sanitizeOrderTrackingPayload(dto.tracking);
    const orderItem: OrderItem = {
      productName: selectedPackage.title,
      sku: `${landingPage.slug}-${selectedPackage.id}`,
      quantity: 1,
      unitPrice: totalPrice,
      lineTotal: totalPrice,
      imageUrl: landingPage.featuredImage ?? landingPage.config.galleryImages[0],
      variantTitle: `${landingPage.name} / ${selectedPackage.quantity} adet`,
    };

    const order = await this.ordersRepository.save(
      this.ordersRepository.create({
        orderNumber,
        customerName: dto.customerName.trim(),
        customerEmail: syntheticEmail,
        customerPhone: this.normalizePhone(dto.customerPhone),
        shippingAddress,
        billingAddress: shippingAddress,
        items: [orderItem],
        subtotal: totalPrice.toFixed(2),
        shippingFee: '0.00',
        discountAmount: '0.00',
        taxAmount: '0.00',
        grandTotal: totalPrice.toFixed(2),
        currency: 'TRY',
        status: 'NEW',
        paymentStatus: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        paymentProvider: payment.paymentProvider,
        paymentTransactionId: null,
        fulfillmentStatus: 'UNFULFILLED',
        customerNote: this.toNullable(dto.address),
        adminNote: null,
        source: 'LANDING_PAGE',
        sourceMeta: {
          generatedEmail: true,
          landingPageId: landingPage.id,
          landingPageName: landingPage.name,
          landingPageSlug: landingPage.slug,
          landingPath: `/landing/${landingPage.slug}`,
          selectedPackageId: selectedPackage.id,
          selectedPackageTitle: selectedPackage.title,
          selectedPackageQuantity: selectedPackage.quantity,
          selectedPaymentOption: dto.paymentMethod,
          ...(tracking ? { tracking } : {}),
        },
        assignedRepresentativeId: null,
        assignmentNote: null,
        assignedAt: null,
        shippingMethod: 'Landing Page Siparisi',
        shippingCompany: null,
        trackingNumber: null,
        trackingUrl: null,
        bankTransferAccount: null,
        bankTransferReceiptUrl: null,
        bankTransferReceiptOriginalName: null,
        bankTransferReceiptNote: null,
        bankTransferReceiptUploadedAt: null,
        stockDeducted: false,
        paidAt: null,
        confirmedAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
      }),
    );

    await this.orderActivitiesRepository.save(
      this.orderActivitiesRepository.create({
        orderId: order.id,
        actorId: null,
        actorUsername: null,
        eventType: 'ORDER_CREATED',
        message: 'Landing page siparisi olusturuldu.',
        meta: {
          source: 'LANDING_PAGE',
          landingPageId: landingPage.id,
          landingPageName: landingPage.name,
          selectedPackageId: selectedPackage.id,
          selectedPackageTitle: selectedPackage.title,
        },
      }),
    );

    await this.realtimeEventsService.emit('orders.created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      grandTotal: order.grandTotal,
      status: order.status,
    });

    return order;
  }

  private buildShippingAddress(fullName: string, phone: string, address?: string) {
    const line1 = this.toNullable(address) ?? 'Adres belirtilmedi';

    return {
      fullName: fullName.trim(),
      phone: this.normalizePhone(phone),
      country: 'Turkiye',
      city: '-',
      district: undefined,
      postalCode: undefined,
      line1,
      line2: undefined,
    };
  }

  private findPackageOrThrow(landingPage: LandingPage, packageId: string) {
    const selectedPackage = landingPage.config.packages.find(
      (item) => item.id === packageId.trim(),
    );

    if (!selectedPackage) {
      throw new BadRequestException('Secilen paket bulunamadi.');
    }

    return selectedPackage;
  }

  private toOrderPaymentMethod(
    value: CreateLandingOrderDto['paymentMethod'],
  ): PaymentMethod {
    if (value === 'CARD_ON_DELIVERY') {
      return 'CARD_ON_DELIVERY';
    }

    if (value === 'CASH_ON_DELIVERY') {
      return 'CASH_ON_DELIVERY';
    }

    return 'CARD';
  }

  private normalizeConfig(
    landingPageName: string,
    rawConfig: Partial<LandingPageConfig>,
  ): LandingPageConfig {
    const defaults = this.createDefaultConfig(landingPageName);
    const config = { ...defaults, ...rawConfig };

    const stepLabels = Array.isArray(rawConfig.stepLabels)
      ? rawConfig.stepLabels.map((item) => item.trim()).filter(Boolean)
      : defaults.stepLabels;

    return {
      ...config,
      announcementTitle: this.takeText(config.announcementTitle, defaults.announcementTitle),
      announcementSubtitle: this.takeText(
        config.announcementSubtitle,
        defaults.announcementSubtitle,
      ),
      stepLabels: stepLabels.length >= 3 ? stepLabels.slice(0, 3) : defaults.stepLabels,
      visitorCount: this.toPositiveInt(config.visitorCount, defaults.visitorCount),
      visitorLabel: this.takeText(config.visitorLabel, defaults.visitorLabel),
      stockCount: this.toPositiveInt(config.stockCount, defaults.stockCount),
      stockLabel: this.takeText(config.stockLabel, defaults.stockLabel),
      packageSectionTitle: this.takeText(
        config.packageSectionTitle,
        defaults.packageSectionTitle,
      ),
      orderSectionTitle: this.takeText(config.orderSectionTitle, defaults.orderSectionTitle),
      addressPlaceholder: this.takeText(config.addressPlaceholder, defaults.addressPlaceholder),
      paymentSectionTitle: this.takeText(
        config.paymentSectionTitle,
        defaults.paymentSectionTitle,
      ),
      orderButtonLabel: this.takeText(config.orderButtonLabel, defaults.orderButtonLabel),
      stickyButtonLabel: this.takeText(
        config.stickyButtonLabel,
        defaults.stickyButtonLabel,
      ),
      termsLabel: this.takeText(config.termsLabel, defaults.termsLabel),
      productInfoTitle: this.takeText(config.productInfoTitle, defaults.productInfoTitle),
      productInfoDescription: this.takeText(
        config.productInfoDescription,
        defaults.productInfoDescription,
      ),
      trustBadges: this.normalizeStringList(config.trustBadges, defaults.trustBadges),
      infoCards: this.normalizeInfoCards(config.infoCards, defaults.infoCards),
      faqTitle: this.takeText(config.faqTitle, defaults.faqTitle),
      faqItems: this.normalizeFaqItems(config.faqItems, defaults.faqItems),
      reviewsTitle: this.takeText(config.reviewsTitle, defaults.reviewsTitle),
      reviews: this.normalizeReviews(config.reviews, defaults.reviews),
      footerSellerText: this.takeText(config.footerSellerText, defaults.footerSellerText),
      footerLinks: this.normalizeFooterLinks(config.footerLinks, defaults.footerLinks),
      galleryImages: this.normalizeStringList(
        config.galleryImages,
        defaults.galleryImages,
      ),
      packages: this.normalizePackages(config.packages, defaults.packages),
    };
  }

  private createDefaultConfig(landingPageName: string): LandingPageConfig {
    return {
      announcementTitle: 'Hizli Siparis',
      announcementSubtitle: '1-3 gunde kapinda, guvenli alisveris',
      stepLabels: ['1. Paket', '2. Bilgiler', '3. Odeme'],
      visitorCount: 47,
      visitorLabel: 'kisi',
      stockCount: 29,
      stockLabel: 'Son urun',
      packageSectionTitle: 'Kac tane alacaksin? (Adet sec)',
      orderSectionTitle: 'Siparis Formu',
      addressPlaceholder: 'Adres (Mahalle, sokak, ilce, il)',
      paymentSectionTitle: 'Nasil odeyeceksin?',
      orderButtonLabel: 'Siparisi Onayla',
      stickyButtonLabel: 'Siparisi Onayla',
      termsLabel: "Sozlesme ve Gizlilik'i okudum.",
      productInfoTitle: `${landingPageName} Urun Bilgileri`,
      productInfoDescription:
        'Urun detaylari, ozellikler, sik sorulanlar ve musteri yorumlarini bu alanda yonetin.',
      trustBadges: ['Hizli Teslimat', 'Kalite Garantisi', 'Kapida Odeme', 'Kolay Iade'],
      infoCards: [
        {
          id: randomUUID(),
          icon: '✓',
          title: 'One Cikan Ozellikler',
          items: ['Ozellik 1', 'Ozellik 2', 'Ozellik 3'],
        },
      ],
      faqTitle: 'Sik Sorulanlar',
      faqItems: [
        {
          id: randomUUID(),
          question: 'Urunle ilgili sik gelen soru',
          answer: 'Bu alandan cevabi duzenleyebilirsiniz.',
        },
      ],
      reviewsTitle: 'Musteri Yorumlari',
      reviews: [
        {
          id: randomUUID(),
          name: 'Ayse K.',
          initials: 'A',
          rating: 5,
          comment: 'Cok hizli kargo, tesekkurler!',
        },
      ],
      footerSellerText: 'Satici:',
      footerLinks: [
        { id: randomUUID(), label: 'Hakkimizda', href: '#' },
        { id: randomUUID(), label: 'Sozlesme', href: '#' },
        { id: randomUUID(), label: 'Odeme', href: '#' },
        { id: randomUUID(), label: 'Gizlilik', href: '#' },
      ],
      galleryImages: [],
      packages: [
        {
          id: randomUUID(),
          title: `1 Adet ${landingPageName}`,
          subtitle: 'Kisa paket aciklamasi',
          note: 'Standart paket',
          badge: 'One Cikan',
          originalPrice: 1999,
          price: 1499,
          quantity: 1,
          highlight: 'Avantajli fiyat',
          isDefault: true,
        },
      ],
    };
  }

  private normalizePackages(
    values: LandingPageConfig['packages'] | undefined,
    fallback: LandingPagePackage[],
  ) {
    if (!Array.isArray(values) || values.length === 0) {
      return fallback;
    }

    const normalized = values
      .map((item, index) => ({
        id: item.id?.trim() || randomUUID(),
        title: this.takeText(item.title, `Paket ${index + 1}`),
        subtitle: this.takeText(item.subtitle, ''),
        note: this.takeOptionalText(item.note),
        badge: this.takeOptionalText(item.badge),
        originalPrice: this.roundToTwo(item.originalPrice),
        price: this.roundToTwo(item.price),
        quantity: this.toPositiveInt(item.quantity, 1),
        highlight: this.takeOptionalText(item.highlight),
        isDefault: Boolean(item.isDefault),
      }))
      .filter((item) => item.title.length > 0);

    if (normalized.length === 0) {
      return fallback;
    }

    const hasDefault = normalized.some((item) => item.isDefault);
    return normalized.map((item, index) => ({
      ...item,
      isDefault: hasDefault ? item.isDefault : index === 0,
    }));
  }

  private normalizeInfoCards(
    values: LandingPageConfig['infoCards'] | undefined,
    fallback: LandingPageInfoCard[],
  ) {
    if (!Array.isArray(values) || values.length === 0) {
      return fallback;
    }

    return values
      .map((item, index) => ({
        id: item.id?.trim() || randomUUID(),
        icon: this.takeText(item.icon, '✓'),
        title: this.takeText(item.title, `Bilgi Karti ${index + 1}`),
        items: this.normalizeStringList(item.items, []),
      }))
      .filter((item) => item.title.length > 0);
  }

  private normalizeFaqItems(
    values: LandingPageConfig['faqItems'] | undefined,
    fallback: LandingPageFaqItem[],
  ) {
    if (!Array.isArray(values) || values.length === 0) {
      return fallback;
    }

    return values
      .map((item, index) => ({
        id: item.id?.trim() || randomUUID(),
        question: this.takeText(item.question, `Soru ${index + 1}`),
        answer: this.takeText(item.answer, 'Cevap alani'),
      }))
      .filter((item) => item.question.length > 0 && item.answer.length > 0);
  }

  private normalizeReviews(
    values: LandingPageConfig['reviews'] | undefined,
    fallback: LandingPageReview[],
  ) {
    if (!Array.isArray(values) || values.length === 0) {
      return fallback;
    }

    return values
      .map((item) => {
        const name = this.takeText(item.name, 'Musteri');
        const initials =
          this.takeOptionalText(item.initials) ??
          name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('')
            .slice(0, 2);

        return {
          id: item.id?.trim() || randomUUID(),
          name,
          initials,
          rating: Math.min(5, Math.max(1, this.toPositiveInt(item.rating, 5))),
          comment: this.takeText(item.comment, 'Yorum alani'),
        };
      })
      .filter((item) => item.comment.length > 0);
  }

  private normalizeFooterLinks(
    values: LandingPageConfig['footerLinks'] | undefined,
    fallback: LandingPageFooterLink[],
  ) {
    if (!Array.isArray(values) || values.length === 0) {
      return fallback;
    }

    return values
      .map((item, index) => ({
        id: item.id?.trim() || randomUUID(),
        label: this.takeText(item.label, `Baglanti ${index + 1}`),
        href: this.takeText(item.href, '#'),
      }))
      .filter((item) => item.label.length > 0 && item.href.length > 0);
  }

  private normalizeStringList(values: string[] | undefined, fallback: string[]) {
    if (!Array.isArray(values)) {
      return fallback;
    }

    const normalized = values.map((item) => item.trim()).filter(Boolean);
    return normalized.length > 0 ? normalized : fallback;
  }

  private async generateUniqueSlug(baseValue: string, currentId?: string) {
    const safeBase = this.slugify(baseValue, 'landing-page');
    let candidate = safeBase;
    let counter = 2;

    while (true) {
      const existing = await this.landingPagesRepository.findOne({
        where: { slug: candidate },
      });

      if (!existing || existing.id === currentId) {
        return candidate;
      }

      candidate = `${safeBase}-${counter}`;
      counter += 1;
    }
  }

  private slugify(value: string, fallback: string) {
    const transliterated = value
      .replace(/[Çç]/g, 'c')
      .replace(/[Ğğ]/g, 'g')
      .replace(/[İIıi]/g, 'i')
      .replace(/[Öö]/g, 'o')
      .replace(/[Şş]/g, 's')
      .replace(/[Üü]/g, 'u');

    const slug = transliterated
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || fallback;
  }

  private async generateOrderNumber() {
    const now = new Date();
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
    const prefix = `LND-${datePart}`;
    const todayCount = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :prefix', { prefix: `${prefix}-%` })
      .getCount();

    let serial = todayCount + 1;
    while (true) {
      const candidate = `${prefix}-${String(serial).padStart(4, '0')}`;
      const existing = await this.ordersRepository.findOne({
        where: { orderNumber: candidate },
      });

      if (!existing) {
        return candidate;
      }

      serial += 1;
    }
  }

  private buildSyntheticEmail(phone: string) {
    const normalizedPhone = this.normalizePhone(phone).replace(/\D/g, '') || Date.now().toString();
    return `landing-${normalizedPhone}@landing.local`;
  }

  private normalizePhone(value: string) {
    return value.replace(/[^\d+]/g, '').trim();
  }

  private takeText(value: string | undefined, fallback: string) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : fallback;
  }

  private takeOptionalText(value?: string) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : undefined;
  }

  private toNullable(value?: string) {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : null;
  }

  private toPositiveInt(value: number | undefined, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  private roundToTwo(value: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Number(parsed.toFixed(2));
  }
}
