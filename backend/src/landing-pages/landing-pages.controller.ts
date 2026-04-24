import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
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
import { CreateLandingOrderDto } from './dto/create-landing-order.dto';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { ListLandingPagesQueryDto } from './dto/list-landing-pages-query.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { LandingPagesService } from './landing-pages.service';

type CurrentUserPayload = {
  sub: string;
  username: string;
  role: 'ADMIN' | 'REPRESENTATIVE';
};

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

@Controller('landing-pages')
export class LandingPagesController {
  constructor(private readonly landingPagesService: LandingPagesService) {}

  private assertAdmin(user: CurrentUserPayload) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Landing page alanina sadece admin erisebilir.');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query() query: ListLandingPagesQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);
    return this.landingPagesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);
    return this.landingPagesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateLandingPageDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);
    return this.landingPagesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLandingPageDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);
    return this.landingPagesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);
    return this.landingPagesService.delete(id);
  }

  @Get('public/orders/:orderNumber')
  @Header('Cache-Control', 'no-store')
  findPublicOrder(@Param('orderNumber') orderNumber: string) {
    return this.landingPagesService.findLandingOrderByOrderNumber(orderNumber);
  }

  @Post('public/:slug/orders')
  createPublicOrder(
    @Param('slug') slug: string,
    @Body() dto: CreateLandingOrderDto,
  ) {
    return this.landingPagesService.createManualOrder(slug, dto);
  }

  @Post('public/:slug/paytr/checkout')
  createPublicPaytrCheckout(
    @Param('slug') slug: string,
    @Body() dto: CreateLandingOrderDto,
    @Req() request: Request,
  ) {
    return this.landingPagesService.createPaytrCheckout(slug, dto, {
      ip: resolveClientIp(request),
      origin: resolveHeaderValue(request.headers.origin),
      referer: resolveHeaderValue(request.headers.referer),
      host: resolveHeaderValue(request.headers.host),
      protocol: request.protocol,
    });
  }

  @Get('public/:slug')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findPublicBySlug(@Param('slug') slug: string) {
    return this.landingPagesService.findPublicBySlug(slug);
  }
}
