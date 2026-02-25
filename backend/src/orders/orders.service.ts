import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../catalog/product.entity';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { AdminUser } from '../users/admin-user.entity';
import { CreateShopOrderDto } from './dto/create-shop-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderActivity } from './order-activity.entity';
import { Order, OrderItem } from './order.entity';

type ActorContext = {
  id: string;
  username: string;
  role: 'ADMIN' | 'REPRESENTATIVE';
};

type ActivityInput = {
  eventType: string;
  message: string;
  meta?: Record<string, unknown>;
};

type StockAction = 'DEDUCT' | 'RESTORE';

const STOCK_BLOCKING_STATUSES: Order['status'][] = ['CANCELLED', 'REFUNDED'];

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderActivity)
    private readonly activitiesRepository: Repository<OrderActivity>,
    @InjectRepository(AdminUser)
    private readonly usersRepository: Repository<AdminUser>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

  async findAll(query: OrderQueryDto, actor: ActorContext) {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.assignedRepresentative', 'assignedRepresentative')
      .orderBy('order.placedAt', 'DESC');

    this.applyOrderFilters(queryBuilder, query);
    this.applyActorScope(queryBuilder, actor, query);

    return queryBuilder.getMany();
  }

  async getSummary(actor: ActorContext) {
    const totalsQuery = this.ordersRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'orderCount')
      .addSelect('COALESCE(SUM(order.grandTotal), 0)', 'totalRevenue')
      .where('order.status NOT IN (:...blocked)', {
        blocked: ['CANCELLED', 'REFUNDED'],
      });

    const statusesQuery = this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status');

    this.applyActorScope(totalsQuery, actor);
    this.applyActorScope(statusesQuery, actor);

    const [totals, statusRows] = await Promise.all([
      totalsQuery.getRawOne<{ orderCount: string; totalRevenue: string }>(),
      statusesQuery.getRawMany<{ status: string; count: string }>(),
    ]);

    const counts = statusRows.reduce<Record<string, number>>((accumulator, row) => {
      accumulator[row.status] = Number(row.count);
      return accumulator;
    }, {});

    const safeTotals = totals ?? { orderCount: '0', totalRevenue: '0' };

    return {
      orderCount: Number(safeTotals.orderCount),
      totalRevenue: Number(safeTotals.totalRevenue),
      byStatus: counts,
    };
  }

  async findOne(id: string, actor: ActorContext) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['assignedRepresentative'],
    });
    if (!order) {
      throw new NotFoundException('Siparis bulunamadi.');
    }

    this.assertActorCanAccessOrder(order, actor);
    return order;
  }

  async findActivities(id: string, actor: ActorContext) {
    await this.findOne(id, actor);

    return this.activitiesRepository.find({
      where: { orderId: id },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  }

  async createFromWebsite(dto: CreateShopOrderDto) {
    const items = dto.items.map<OrderItem>((item) => {
      const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));
      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice.toFixed(2)),
        lineTotal,
        imageUrl: item.imageUrl,
        variantTitle: item.variantTitle,
      };
    });

    const subtotal = items.reduce((accumulator, item) => accumulator + item.lineTotal, 0);
    const shippingFee = Number((dto.shippingFee ?? 0).toFixed(2));
    const discountAmount = Number((dto.discountAmount ?? 0).toFixed(2));
    const taxAmount = Number((dto.taxAmount ?? 0).toFixed(2));
    const grandTotal = Number((subtotal + shippingFee + taxAmount - discountAmount).toFixed(2));
    const orderNumber = await this.generateOrderNumber();
    const paymentStatus = dto.paymentStatus ?? 'PENDING';

    const saved = await this.dataSource.transaction(async (manager) => {
      const productRepository = manager.getRepository(Product);
      const orderRepository = manager.getRepository(Order);
      const activityRepository = manager.getRepository(OrderActivity);

      await this.applyStockForOrderItems(items, productRepository, 'DEDUCT');

      const order = orderRepository.create({
        orderNumber,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: this.toNullable(dto.customerPhone),
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress ?? null,
        items,
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        currency: (dto.currency ?? 'TRY').toUpperCase(),
        status: 'NEW',
        paymentStatus,
        paymentMethod: dto.paymentMethod ?? 'CARD',
        paymentProvider: this.toNullable(dto.paymentProvider),
        paymentTransactionId: this.toNullable(dto.paymentTransactionId),
        fulfillmentStatus: 'UNFULFILLED',
        customerNote: this.toNullable(dto.customerNote),
        adminNote: null,
        source: 'WEBSITE',
        assignedRepresentativeId: null,
        assignedRepresentative: null,
        assignmentNote: null,
        assignedAt: null,
        shippingMethod: this.toNullable(dto.shippingMethod),
        shippingCompany: null,
        trackingNumber: null,
        trackingUrl: null,
        paidAt: paymentStatus === 'PAID' ? new Date() : null,
        confirmedAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        stockDeducted: true,
      });

      const persisted = await orderRepository.save(order);

      await activityRepository.save(
        activityRepository.create({
          orderId: persisted.id,
          actorId: null,
          actorUsername: null,
          eventType: 'ORDER_CREATED',
          message: 'Website siparisi olusturuldu.',
          meta: { source: 'WEBSITE' },
        }),
      );

      await activityRepository.save(
        activityRepository.create({
          orderId: persisted.id,
          actorId: null,
          actorUsername: null,
          eventType: 'STOCK_DEDUCTED',
          message: 'Siparis urunlerine ait stoklar dusuldu.',
          meta: {
            items: items.map((item) => ({
              productId: item.productId ?? null,
              sku: item.sku ?? null,
              quantity: item.quantity,
            })),
          },
        }),
      );

      return persisted;
    });

    await this.realtimeEventsService.emit('orders.created', {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      grandTotal: saved.grandTotal,
      status: saved.status,
    });

    return this.ordersRepository.findOne({
      where: { id: saved.id },
      relations: ['assignedRepresentative'],
    });
  }

  async updateOrder(id: string, dto: UpdateOrderDto, actor: ActorContext) {
    const order = await this.findOne(id, actor);
    const activities: ActivityInput[] = [];

    if (dto.clearAssignment) {
      if (actor.role !== 'ADMIN') {
        throw new ForbiddenException('Zimmet kaldirma sadece admin tarafindan yapilabilir.');
      }

      if (order.assignedRepresentativeId) {
        const previous = order.assignedRepresentative?.fullName ?? 'Temsilci';
        order.assignedRepresentativeId = null;
        order.assignedRepresentative = null;
        order.assignedAt = null;
        activities.push({
          eventType: 'ASSIGNMENT_CLEARED',
          message: `Siparis zimmeti kaldirildi. (Onceki: ${previous})`,
        });
      }
    }

    if (dto.assignedRepresentativeId !== undefined) {
      if (actor.role === 'REPRESENTATIVE' && dto.assignedRepresentativeId !== actor.id) {
        throw new ForbiddenException('Temsilci sadece kendine zimmet alabilir.');
      }

      const representative = await this.resolveRepresentative(dto.assignedRepresentativeId);
      const wasDifferent = order.assignedRepresentativeId !== representative.id;

      order.assignedRepresentativeId = representative.id;
      order.assignedRepresentative = representative;
      if (wasDifferent) {
        order.assignedAt = new Date();
        activities.push({
          eventType: 'ASSIGNMENT_CHANGED',
          message: `Siparis ${representative.fullName} temsilcisine zimmetlendi.`,
          meta: { representativeId: representative.id, representativeUsername: representative.username },
        });
      }
    } else if (actor.role === 'REPRESENTATIVE' && !order.assignedRepresentativeId) {
      const representative = await this.resolveRepresentative(actor.id);
      order.assignedRepresentativeId = representative.id;
      order.assignedRepresentative = representative;
      order.assignedAt = new Date();
      activities.push({
        eventType: 'ASSIGNMENT_CLAIMED',
        message: 'Siparis temsilci tarafindan zimmet alindi.',
        meta: { representativeId: representative.id, representativeUsername: representative.username },
      });
    }

    if (dto.assignmentNote !== undefined) {
      order.assignmentNote = this.toNullable(dto.assignmentNote);
      activities.push({
        eventType: 'ASSIGNMENT_NOTE_UPDATED',
        message: 'Zimmet notu guncellendi.',
      });
    }

    if (actor.role === 'REPRESENTATIVE' && order.assignedRepresentativeId !== actor.id) {
      throw new ForbiddenException('Bu siparis baska bir temsilciye zimmetli.');
    }

    const previousStatus = order.status;

    if (dto.status !== undefined && dto.status !== order.status) {
      order.status = dto.status;

      if (dto.status === 'CONFIRMED' && !order.confirmedAt) {
        order.confirmedAt = new Date();
      }
      if (dto.status === 'SHIPPED' && !order.shippedAt) {
        order.shippedAt = new Date();
      }
      if (dto.status === 'DELIVERED' && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }
      if (dto.status === 'CANCELLED' && !order.cancelledAt) {
        order.cancelledAt = new Date();
      }

      activities.push({
        eventType: 'ORDER_STATUS_UPDATED',
        message: `Siparis durumu ${previousStatus} -> ${dto.status} olarak guncellendi.`,
      });
    }

    if (dto.paymentStatus !== undefined && dto.paymentStatus !== order.paymentStatus) {
      const previousPaymentStatus = order.paymentStatus;
      order.paymentStatus = dto.paymentStatus;

      if (dto.paymentStatus === 'PAID' && !order.paidAt) {
        order.paidAt = new Date();
      }
      if (dto.paymentStatus !== 'PAID') {
        order.paidAt = null;
      }

      activities.push({
        eventType: 'PAYMENT_STATUS_UPDATED',
        message: `Odeme durumu ${previousPaymentStatus} -> ${dto.paymentStatus} olarak guncellendi.`,
      });
    }

    if (dto.paymentMethod !== undefined && dto.paymentMethod !== order.paymentMethod) {
      const previousPaymentMethod = order.paymentMethod;
      order.paymentMethod = dto.paymentMethod;
      activities.push({
        eventType: 'PAYMENT_METHOD_UPDATED',
        message: `Odeme yontemi ${previousPaymentMethod} -> ${dto.paymentMethod} olarak degisti.`,
      });
    }

    if (dto.paymentProvider !== undefined) {
      order.paymentProvider = this.toNullable(dto.paymentProvider);
    }

    if (dto.paymentTransactionId !== undefined) {
      order.paymentTransactionId = this.toNullable(dto.paymentTransactionId);
    }

    if (
      dto.fulfillmentStatus !== undefined &&
      dto.fulfillmentStatus !== order.fulfillmentStatus
    ) {
      const previousFulfillmentStatus = order.fulfillmentStatus;
      order.fulfillmentStatus = dto.fulfillmentStatus;

      if (dto.fulfillmentStatus === 'SHIPPED' && !order.shippedAt) {
        order.shippedAt = new Date();
      }
      if (dto.fulfillmentStatus === 'DELIVERED' && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }

      activities.push({
        eventType: 'FULFILLMENT_STATUS_UPDATED',
        message: `Kargo durumu ${previousFulfillmentStatus} -> ${dto.fulfillmentStatus} olarak guncellendi.`,
      });
    }

    if (dto.shippingMethod !== undefined) {
      order.shippingMethod = this.toNullable(dto.shippingMethod);
    }

    if (dto.adminNote !== undefined) {
      order.adminNote = this.toNullable(dto.adminNote);
      activities.push({
        eventType: 'ADMIN_NOTE_UPDATED',
        message: 'Admin notu guncellendi.',
      });
    }

    if (dto.shippingCompany !== undefined) {
      order.shippingCompany = this.toNullable(dto.shippingCompany);
    }

    if (dto.trackingNumber !== undefined) {
      order.trackingNumber = this.toNullable(dto.trackingNumber);
    }

    if (dto.trackingUrl !== undefined) {
      order.trackingUrl = this.toNullable(dto.trackingUrl);
    }

    const stockAction = this.resolveStockAction(
      previousStatus,
      order.status,
      order.stockDeducted,
    );

    const saved = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const productRepository = manager.getRepository(Product);
      const activityRepository = manager.getRepository(OrderActivity);
      const transactionActivities = [...activities];

      if (stockAction === 'RESTORE') {
        await this.applyStockForOrderItems(order.items, productRepository, 'RESTORE');
        order.stockDeducted = false;
        transactionActivities.push({
          eventType: 'STOCK_RESTORED',
          message: 'Siparis iptal/iade durumuna gectigi icin stoklar geri yuklendi.',
          meta: {
            status: order.status,
            items: order.items.map((item) => ({
              productId: item.productId ?? null,
              sku: item.sku ?? null,
              quantity: item.quantity,
            })),
          },
        });
      }

      if (stockAction === 'DEDUCT') {
        await this.applyStockForOrderItems(order.items, productRepository, 'DEDUCT');
        order.stockDeducted = true;
        transactionActivities.push({
          eventType: 'STOCK_DEDUCTED',
          message: 'Siparis aktif duruma alindigi icin stoklar yeniden dusuldu.',
          meta: {
            status: order.status,
            items: order.items.map((item) => ({
              productId: item.productId ?? null,
              sku: item.sku ?? null,
              quantity: item.quantity,
            })),
          },
        });
      }

      const persisted = await orderRepository.save(order);

      if (transactionActivities.length > 0) {
        await this.addActivities(
          persisted.id,
          actor,
          transactionActivities,
          activityRepository,
        );
      }

      return persisted;
    });


    await this.realtimeEventsService.emit('orders.updated', {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      status: saved.status,
      paymentStatus: saved.paymentStatus,
      fulfillmentStatus: saved.fulfillmentStatus,
      assignedRepresentativeId: saved.assignedRepresentativeId,
    });

    return this.findOne(saved.id, actor);
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.ordersRepository.findOne({ where: { orderNumber } });
    if (!order) {
      throw new NotFoundException('Siparis bulunamadi.');
    }

    return order;
  }

  private applyOrderFilters(
    queryBuilder: SelectQueryBuilder<Order>,
    query: OrderQueryDto,
  ) {
    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    if (query.paymentMethod) {
      queryBuilder.andWhere('order.paymentMethod = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }

    if (query.fulfillmentStatus) {
      queryBuilder.andWhere('order.fulfillmentStatus = :fulfillmentStatus', {
        fulfillmentStatus: query.fulfillmentStatus,
      });
    }

    if (query.assignedRepresentativeId) {
      queryBuilder.andWhere(
        'order.assignedRepresentativeId = :assignedRepresentativeId',
        { assignedRepresentativeId: query.assignedRepresentativeId },
      );
    }

    if (query.search) {
      const value = `%${query.search.trim()}%`;
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :value OR order.customerName ILIKE :value OR order.customerEmail ILIKE :value OR order.customerPhone ILIKE :value)',
        { value },
      );
    }
  }

  private applyActorScope(
    queryBuilder: SelectQueryBuilder<Order>,
    actor: ActorContext,
    query?: OrderQueryDto,
  ) {
    if (actor.role !== 'REPRESENTATIVE') {
      return;
    }

    if (
      query?.assignedRepresentativeId &&
      query.assignedRepresentativeId !== actor.id
    ) {
      throw new ForbiddenException('Temsilci sadece kendi zimmet siparislerini gorebilir.');
    }

    if (query?.mine === 'true') {
      queryBuilder.andWhere('order.assignedRepresentativeId = :actorId', {
        actorId: actor.id,
      });
      return;
    }

    queryBuilder.andWhere(
      '(order.assignedRepresentativeId = :actorId OR order.assignedRepresentativeId IS NULL)',
      { actorId: actor.id },
    );
  }

  private assertActorCanAccessOrder(order: Order, actor: ActorContext) {
    if (actor.role !== 'REPRESENTATIVE') {
      return;
    }

    if (order.assignedRepresentativeId && order.assignedRepresentativeId !== actor.id) {
      throw new ForbiddenException('Bu siparise erisim yetkiniz yok.');
    }
  }

  private resolveStockAction(
    previousStatus: Order['status'],
    nextStatus: Order['status'],
    stockDeducted: boolean,
  ): StockAction | null {
    const wasBlocked = STOCK_BLOCKING_STATUSES.includes(previousStatus);
    const isBlocked = STOCK_BLOCKING_STATUSES.includes(nextStatus);

    if (!wasBlocked && isBlocked && stockDeducted) {
      return 'RESTORE';
    }

    if (wasBlocked && !isBlocked && !stockDeducted) {
      return 'DEDUCT';
    }

    return null;
  }

  private async applyStockForOrderItems(
    items: OrderItem[],
    productRepository: Repository<Product>,
    action: StockAction,
  ) {
    for (const item of items) {
      const linkedProduct = await this.resolveProductForOrderItem(
        item,
        productRepository,
      );
      if (!linkedProduct) {
        continue;
      }

      item.productId = item.productId ?? linkedProduct.id;
      const quantity = Number(item.quantity ?? 0);
      const delta = action === 'DEDUCT' ? -quantity : quantity;

      if (
        linkedProduct.hasVariants &&
        linkedProduct.variants.length > 0 &&
        item.sku
      ) {
        const variantIndex = linkedProduct.variants.findIndex(
          (variant) => variant.sku === item.sku,
        );

        if (variantIndex >= 0) {
          const variant = linkedProduct.variants[variantIndex];
          const nextStock = Number(variant.stock ?? 0) + delta;

          if (nextStock < 0) {
            throw new ConflictException(
              `${linkedProduct.name} (${variant.sku}) icin stok yetersiz.`,
            );
          }

          linkedProduct.variants[variantIndex] = {
            ...variant,
            stock: nextStock,
          };
          linkedProduct.stock = linkedProduct.variants.reduce(
            (total, variantItem) => total + Number(variantItem.stock ?? 0),
            0,
          );

          await productRepository.save(linkedProduct);
          continue;
        }
      }

      const nextStock = Number(linkedProduct.stock ?? 0) + delta;
      if (nextStock < 0) {
        throw new ConflictException(`${linkedProduct.name} icin stok yetersiz.`);
      }

      linkedProduct.stock = nextStock;
      await productRepository.save(linkedProduct);
    }
  }

  private async resolveProductForOrderItem(
    item: OrderItem,
    productRepository: Repository<Product>,
  ) {
    if (item.productId) {
      const byId = await productRepository.findOne({
        where: { id: item.productId },
      });

      if (!byId) {
        throw new NotFoundException(`Urun bulunamadi: ${item.productId}`);
      }

      return byId;
    }

    if (item.sku) {
      const byProductSku = await productRepository.findOne({
        where: { sku: item.sku },
      });
      if (byProductSku) {
        return byProductSku;
      }

      return productRepository
        .createQueryBuilder('product')
        .where(
          `EXISTS (
            SELECT 1
            FROM jsonb_array_elements(product.variants) variant
            WHERE variant->>'sku' = :sku
          )`,
          { sku: item.sku },
        )
        .getOne();
    }

    return null;
  }

  private async addActivities(
    orderId: string,
    actor: ActorContext | null,
    activities: ActivityInput[],
    repository: Repository<OrderActivity> = this.activitiesRepository,
  ) {
    const entities = activities.map((item) =>
      repository.create({
        orderId,
        actorId: actor?.id ?? null,
        actorUsername: actor?.username ?? null,
        eventType: item.eventType,
        message: item.message,
        meta: item.meta ?? {},
      }),
    );

    await repository.save(entities);
  }

  private async resolveRepresentative(id: string) {
    const representative = await this.usersRepository.findOne({
      where: { id, role: 'REPRESENTATIVE', isActive: true },
    });

    if (!representative) {
      throw new NotFoundException('Musteri temsilcisi bulunamadi veya pasif.');
    }

    return representative;
  }

  private async generateOrderNumber() {
    const now = new Date();
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    const prefix = `ZYT-${datePart}`;
    const todayCount = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :prefix', { prefix: `${prefix}-%` })
      .getCount();

    let serial = todayCount + 1;

    while (true) {
      const orderNumber = `${prefix}-${String(serial).padStart(4, '0')}`;
      const existing = await this.ordersRepository.findOne({
        where: { orderNumber },
      });

      if (!existing) {
        return orderNumber;
      }

      serial += 1;
    }
  }

  private toNullable(value?: string) {
    if (value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
