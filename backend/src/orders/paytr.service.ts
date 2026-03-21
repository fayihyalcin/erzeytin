import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { SettingsService } from '../settings/settings.service';
import { CreateShopOrderDto } from './dto/create-shop-order.dto';
import { Order } from './order.entity';
import { OrdersService } from './orders.service';
import { PaymentTransaction } from './payment-transaction.entity';

type PaytrClientContext = {
  ip: string;
  origin?: string;
  referer?: string;
  host?: string;
  protocol?: string;
};

type PaytrSettings = {
  enabled: boolean;
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  siteUrl: string | null;
  testMode: boolean;
  debugOn: boolean;
  noInstallment: boolean;
  maxInstallment: number;
  timeoutLimit: number;
  lang: string;
};

type PaytrApiResponse =
  | { status: 'success'; token: string }
  | { status: 'failed'; reason?: string };

@Injectable()
export class PaytrService {
  private readonly logger = new Logger(PaytrService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionsRepository: Repository<PaymentTransaction>,
    private readonly ordersService: OrdersService,
    private readonly settingsService: SettingsService,
  ) {}

  async createCheckout(dto: CreateShopOrderDto, context: PaytrClientContext) {
    const settingsRecord = await this.settingsService.findAll();
    const settings = this.parseSettings(settingsRecord);

    if (!settings.enabled) {
      throw new BadRequestException('PAYTR odeme sistemi aktif degil.');
    }

    if (!settings.merchantId || !settings.merchantKey || !settings.merchantSalt) {
      throw new BadRequestException('PAYTR ayarlari eksik. Merchant bilgilerini kontrol edin.');
    }

    if ((dto.paymentMethod ?? 'CARD') !== 'CARD') {
      throw new BadRequestException('PAYTR checkout sadece kredi karti odemeleri icindir.');
    }

    const merchantOid = this.createMerchantOid();
    const order = await this.ordersService.createFromWebsite({
      ...dto,
      paymentMethod: 'CARD',
      paymentStatus: 'PENDING',
      paymentProvider: 'PAYTR',
      paymentTransactionId: merchantOid,
    });

    if (!order) {
      throw new BadRequestException('Odeme icin siparis hazirlanamadi.');
    }

    let payment: PaymentTransaction | null = null;
    try {
      payment = await this.paymentTransactionsRepository.save(
        this.paymentTransactionsRepository.create({
          orderId: order.id,
          provider: 'PAYTR',
          merchantOid,
          status: 'PENDING',
          requestAmount: order.grandTotal,
          paidAmount: null,
          currency: order.currency,
          iframeToken: null,
          paymentType: null,
          providerTransactionId: null,
          failureCode: null,
          failureMessage: null,
          callbackCount: 0,
          isTest: settings.testMode,
          rawRequest: {},
          rawResponse: {},
          rawCallback: {},
          paidAt: null,
          failedAt: null,
        }),
      );
    } catch (error) {
      this.logger.error(
        `PAYTR transaction log kaydi olusturulamadi (${merchantOid}). Order fallback kullanilacak. ${this.describeError(error)}`,
      );
    }

    try {
      const paymentAmount = this.toMinorUnits(order.grandTotal);
      const currency = this.resolvePaytrCurrency(order.currency);
      const userBasket = Buffer.from(
        JSON.stringify(
          order.items.map((item) => [
            this.limitText(item.productName, 120),
            Number(item.unitPrice).toFixed(2),
            Number(item.quantity),
          ]),
        ),
      ).toString('base64');

      const merchantOkUrl = this.buildReturnUrl(
        settings.siteUrl,
        context,
        order.orderNumber,
        merchantOid,
        'success',
      );
      const merchantFailUrl = this.buildReturnUrl(
        settings.siteUrl,
        context,
        order.orderNumber,
        merchantOid,
        'failed',
      );

      const hashStr = [
        settings.merchantId,
        this.normalizeIp(context.ip),
        merchantOid,
        order.customerEmail,
        String(paymentAmount),
        userBasket,
        settings.noInstallment ? '1' : '0',
        String(settings.maxInstallment),
        currency,
        settings.testMode ? '1' : '0',
      ].join('');
      const paytrToken = this.hashToBase64(
        `${hashStr}${settings.merchantSalt}`,
        settings.merchantKey,
      );

      const requestPayload = {
        merchant_id: settings.merchantId,
        user_ip: this.normalizeIp(context.ip),
        merchant_oid: merchantOid,
        email: order.customerEmail,
        payment_amount: String(paymentAmount),
        paytr_token: paytrToken,
        user_basket: userBasket,
        debug_on: settings.debugOn ? '1' : '0',
        no_installment: settings.noInstallment ? '1' : '0',
        max_installment: String(settings.maxInstallment),
        user_name: order.customerName,
        user_address: this.formatAddress(order.shippingAddress),
        user_phone: order.customerPhone ?? '',
        merchant_ok_url: merchantOkUrl,
        merchant_fail_url: merchantFailUrl,
        timeout_limit: String(settings.timeoutLimit),
        currency,
        test_mode: settings.testMode ? '1' : '0',
        lang: settings.lang,
      };

      const apiResponse = await this.fetchToken(requestPayload);

      if (payment) {
        payment.iframeToken = apiResponse.token;
        payment.rawRequest = {
          ...requestPayload,
          paytr_token: '[REDACTED]',
        };
        payment.rawResponse = apiResponse;
        payment.failureCode = null;
        payment.failureMessage = null;
        payment.failedAt = null;

        try {
          await this.paymentTransactionsRepository.save(payment);
        } catch (error) {
          this.logger.error(
            `PAYTR transaction log kaydi guncellenemedi (${merchantOid}). Order fallback kullanilacak. ${this.describeError(error)}`,
          );
          payment = null;
        }
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        merchantOid,
        paymentId: payment?.id ?? merchantOid,
        iframeToken: apiResponse.token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${apiResponse.token}`,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'PAYTR odeme oturumu olusturulamadi.';

      if (payment) {
        payment.status = 'FAILED';
        payment.failureMessage = message;
        payment.failedAt = new Date();

        try {
          await this.paymentTransactionsRepository.save(payment);
        } catch (persistError) {
          this.logger.error(
            `PAYTR failed transaction log kaydi guncellenemedi (${merchantOid}). ${this.describeError(persistError)}`,
          );
        }
      }

      await this.ordersService.markOrderPaymentFailedBySystem(order.id, {
        provider: 'PAYTR',
        transactionId: merchantOid,
        reason: `PAYTR iframe token alinamadi: ${message}`,
        meta: {
          merchantOid,
          stage: 'TOKEN_REQUEST',
        },
        cancelOrder: true,
      });

      throw new BadRequestException(message);
    }
  }

  async handleCallback(payload: Record<string, unknown>) {
    const merchantOid = String(payload.merchant_oid ?? '').trim();
    const status = String(payload.status ?? '').trim().toLowerCase();
    const totalAmount = String(payload.total_amount ?? '').trim();
    const hash = String(payload.hash ?? '').trim();

    if (!merchantOid || !status || !totalAmount || !hash) {
      throw new BadRequestException('PAYTR callback verisi eksik.');
    }

    const settingsRecord = await this.settingsService.findAll();
    const settings = this.parseSettings(settingsRecord);
    if (!settings.merchantKey || !settings.merchantSalt) {
      throw new BadRequestException('PAYTR callback dogrulamasi icin ayarlar eksik.');
    }

    let payment: PaymentTransaction | null = null;
    try {
      payment = await this.paymentTransactionsRepository.findOne({
        where: { merchantOid },
        relations: ['order'],
      });
    } catch (error) {
      this.logger.error(
        `PAYTR callback transaction sorgusu basarisiz (${merchantOid}). Order fallback kullanilacak. ${this.describeError(error)}`,
      );
    }

    if (!payment) {
      const fallbackOrder = await this.ordersRepository.findOne({
        where: { paymentTransactionId: merchantOid },
      });

      if (!fallbackOrder) {
        throw new NotFoundException('Odeme kaydi bulunamadi.');
      }

      if (status === 'success') {
        await this.ordersService.markOrderPaymentPaidBySystem(fallbackOrder.id, {
          provider: 'PAYTR',
          transactionId: merchantOid,
          message: 'PAYTR callback ile odeme basarili olarak onaylandi.',
          meta: {
            merchantOid,
            paymentType: this.toNullableString(payload.payment_type),
            totalAmount,
            fallback: 'ORDER_ONLY',
          },
        });
        return;
      }

      const failureCode = this.toNullableString(payload.failed_reason_code);
      const failureMessage =
        this.toNullableString(payload.failed_reason_msg) ?? 'Odeme PAYTR tarafinda basarisiz oldu.';
      await this.ordersService.markOrderPaymentFailedBySystem(fallbackOrder.id, {
        provider: 'PAYTR',
        transactionId: merchantOid,
        reason: `PAYTR callback: ${failureMessage}`,
        meta: {
          merchantOid,
          failedReasonCode: failureCode,
          failedReasonMessage: failureMessage,
          totalAmount,
          fallback: 'ORDER_ONLY',
        },
        cancelOrder: true,
      });
      return;
    }

    const callbackHash = this.hashToBase64(
      `${merchantOid}${settings.merchantSalt}${status}${totalAmount}`,
      settings.merchantKey,
    );

    if (callbackHash !== hash) {
      this.logger.warn(`PAYTR callback hash dogrulanamadi: ${merchantOid}`);
      throw new BadRequestException('PAYTR callback hash gecersiz.');
    }

    payment.callbackCount += 1;
    payment.rawCallback = payload as Record<string, unknown>;

    if (payment.status === 'PAID') {
      await this.paymentTransactionsRepository.save(payment);
      return;
    }

    if (payment.status === 'FAILED') {
      await this.paymentTransactionsRepository.save(payment);
      return;
    }

    if (status === 'success') {
      const paidAmount = this.toAmountStringFromMinor(totalAmount);
      payment.status = 'PAID';
      payment.paidAmount = paidAmount;
      payment.paymentType = this.toNullableString(payload.payment_type);
      payment.providerTransactionId = merchantOid;
      payment.failureCode = null;
      payment.failureMessage = null;
      payment.paidAt = new Date();
      payment.failedAt = null;
      await this.paymentTransactionsRepository.save(payment);

      await this.ordersService.markOrderPaymentPaidBySystem(payment.orderId, {
        provider: 'PAYTR',
        transactionId: merchantOid,
        message: 'PAYTR callback ile odeme basarili olarak onaylandi.',
        meta: {
          merchantOid,
          paymentType: payment.paymentType,
          totalAmount,
        },
      });

      return;
    }

    payment.status = 'FAILED';
    payment.failureCode = this.toNullableString(payload.failed_reason_code);
    payment.failureMessage =
      this.toNullableString(payload.failed_reason_msg) ?? 'Odeme PAYTR tarafinda basarisiz oldu.';
    payment.providerTransactionId = merchantOid;
    payment.failedAt = new Date();
    payment.paidAt = null;
    await this.paymentTransactionsRepository.save(payment);

    await this.ordersService.markOrderPaymentFailedBySystem(payment.orderId, {
      provider: 'PAYTR',
      transactionId: merchantOid,
      reason: `PAYTR callback: ${payment.failureMessage}`,
      meta: {
        merchantOid,
        failedReasonCode: payment.failureCode,
        failedReasonMessage: payment.failureMessage,
        totalAmount,
      },
      cancelOrder: true,
    });
  }

  private async fetchToken(
    payload: Record<string, string>,
  ): Promise<{ status: 'success'; token: string }> {
    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload),
    });

    const bodyText = await response.text();
    let data: PaytrApiResponse;

    try {
      data = JSON.parse(bodyText) as PaytrApiResponse;
    } catch {
      throw new BadRequestException('PAYTR beklenmeyen bir cevap dondurdu.');
    }

    if (!response.ok || data.status !== 'success' || !('token' in data) || !data.token) {
      const reason = 'reason' in data ? data.reason : null;
      throw new BadRequestException(
        reason || 'PAYTR iframe token uretilemedi.',
      );
    }

    return data;
  }

  private buildReturnUrl(
    siteUrl: string | null,
    context: PaytrClientContext,
    orderNumber: string,
    merchantOid: string,
    result: 'success' | 'failed',
  ) {
    const resolvedBaseUrl =
      siteUrl ||
      this.normalizeBaseUrl(context.origin) ||
      this.extractOrigin(context.referer) ||
      this.normalizeBaseUrl(
        context.host ? `${context.protocol ?? 'http'}://${context.host}` : '',
      );

    if (!resolvedBaseUrl) {
      throw new BadRequestException(
        'PAYTR yonlendirme adresi olusturulamadi. siteUrl ayarini tanimlayin.',
      );
    }

    const url = new URL('/checkout/paytr/return', resolvedBaseUrl);
    url.searchParams.set('order', orderNumber);
    url.searchParams.set('merchantOid', merchantOid);
    url.searchParams.set('result', result);
    return url.toString();
  }

  private parseSettings(record: Record<string, string | undefined>): PaytrSettings {
    return {
      enabled: this.toBoolean(record.paytrEnabled, false),
      merchantId: record.paytrMerchantId?.trim() ?? '',
      merchantKey: record.paytrMerchantKey?.trim() ?? '',
      merchantSalt: record.paytrMerchantSalt?.trim() ?? '',
      siteUrl: this.normalizeBaseUrl(record.siteUrl),
      testMode: this.toBoolean(record.paytrTestMode, true),
      debugOn: this.toBoolean(record.paytrDebugOn, true),
      noInstallment: this.toBoolean(record.paytrNoInstallment, false),
      maxInstallment: this.toPositiveInt(record.paytrMaxInstallment, 0),
      timeoutLimit: this.toPositiveInt(record.paytrTimeoutLimit, 30),
      lang: (record.paytrLang?.trim().toLowerCase() || 'tr').slice(0, 2),
    };
  }

  private createMerchantOid() {
    return `PAYTR${Date.now()}${randomBytes(6).toString('hex').toUpperCase()}`;
  }

  private resolvePaytrCurrency(value: string) {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'TRY') {
      return 'TL';
    }

    return normalized || 'TL';
  }

  private formatAddress(address: {
    line1: string;
    line2?: string;
    district?: string;
    city: string;
    country: string;
  }) {
    return [address.line1, address.line2, address.district, address.city, address.country]
      .filter((item) => item && item.trim().length > 0)
      .join(', ')
      .slice(0, 400);
  }

  private normalizeIp(value: string) {
    const normalized = value.trim();
    if (!normalized || normalized === '::1') {
      return '127.0.0.1';
    }

    if (normalized.startsWith('::ffff:')) {
      return normalized.slice(7);
    }

    return normalized;
  }

  private hashToBase64(value: string, secret: string) {
    return createHmac('sha256', secret).update(value).digest('base64');
  }

  private toMinorUnits(value: string | number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.round(parsed * 100);
  }

  private toAmountStringFromMinor(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return '0.00';
    }

    return (parsed / 100).toFixed(2);
  }

  private toBoolean(value: string | undefined, fallback: boolean) {
    if (value === undefined) {
      return fallback;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return fallback;
    }

    return ['1', 'true', 'yes', 'on'].includes(normalized);
  }

  private toPositiveInt(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  private normalizeBaseUrl(value?: string | null) {
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);
      return url.origin;
    } catch {
      return null;
    }
  }

  private extractOrigin(value?: string) {
    if (!value) {
      return null;
    }

    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  }

  private toNullableString(value: unknown) {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private describeError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Bilinmeyen hata';
  }

  private limitText(value: string, maxLength: number) {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
  }
}
