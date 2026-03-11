import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateShopOrderDto } from './dto/create-shop-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';
import { PaytrService } from './paytr.service';

type CurrentUserPayload = {
  sub: string;
  username: string;
  role: 'ADMIN' | 'REPRESENTATIVE';
};

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(
    @Query() query: OrderQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.findAll(query, {
      id: user.sub,
      username: user.username,
      role: user.role,
    });
  }

  @Get('summary')
  summary(@CurrentUser() user: CurrentUserPayload) {
    return this.ordersService.getSummary({
      id: user.sub,
      username: user.username,
      role: user.role,
    });
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.findOne(id, {
      id: user.sub,
      username: user.username,
      role: user.role,
    });
  }

  @Get(':id/activities')
  activities(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.findActivities(id, {
      id: user.sub,
      username: user.username,
      role: user.role,
    });
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.updateOrder(id, dto, {
      id: user.sub,
      username: user.username,
      role: user.role,
    });
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.deleteOrder(id, {
      id: user.sub,
      username: user.username,
      role: user.role,
    });
  }
}

@Controller('shop/orders')
export class ShopOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateShopOrderDto) {
    return this.ordersService.createFromWebsite(dto);
  }

  @Get(':orderNumber')
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }
}

function resolveClientIp(request: Request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || request.ip || '127.0.0.1';
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0] || request.ip || '127.0.0.1';
  }

  return request.ip || request.socket.remoteAddress || '127.0.0.1';
}

function resolveHeaderValue(value: string | string[] | undefined) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}

@Controller('shop/payments')
export class ShopPaymentsController {
  constructor(private readonly paytrService: PaytrService) {}

  @Post('paytr/checkout')
  createPaytrCheckout(
    @Body() dto: CreateShopOrderDto,
    @Req() request: Request,
  ) {
    return this.paytrService.createCheckout(dto, {
      ip: resolveClientIp(request),
      origin: resolveHeaderValue(request.headers.origin),
      referer: resolveHeaderValue(request.headers.referer),
      host: resolveHeaderValue(request.headers.host),
      protocol: request.protocol,
    });
  }

  @Post('paytr/callback')
  @HttpCode(200)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async handlePaytrCallback(@Body() payload: Record<string, unknown>) {
    await this.paytrService.handleCallback(payload);
    return 'OK';
  }
}
