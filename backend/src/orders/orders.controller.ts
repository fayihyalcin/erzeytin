import {
  BadRequestException,
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
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ensureUploadTargetDir,
  resolveFileExtension,
  sanitizeFileNameBase,
} from '../media/media.utils';
import { CreateShopOrderDto } from './dto/create-shop-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UploadBankTransferReceiptDto } from './dto/upload-bank-transfer-receipt.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';
import { PaytrService } from './paytr.service';

type CurrentUserPayload = {
  sub: string;
  username: string;
  role: 'ADMIN' | 'REPRESENTATIVE';
};

const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function resolveReceiptMaxFileSizeBytes() {
  const raw = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? '8');
  const safeValue = Number.isFinite(raw) && raw > 0 ? raw : 8;
  return Math.trunc(safeValue * 1024 * 1024);
}

function createStoredReceiptFilename(originalName: string, mimeType: string) {
  const extension = resolveFileExtension(originalName, mimeType);
  const baseName = originalName.includes('.')
    ? originalName.slice(0, originalName.lastIndexOf('.'))
    : originalName;

  return `${Date.now()}-${randomUUID()}-${sanitizeFileNameBase(baseName)}${extension}`;
}

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

  @Post(':orderNumber/bank-transfer-receipt')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_RECEIPT_MIME_TYPES.has(file.mimetype)) {
          callback(
            new UnsupportedMediaTypeException(
              'Dekont olarak sadece PDF, JPG, PNG veya WEBP yukleyebilirsiniz.',
            ) as unknown as Error,
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: resolveReceiptMaxFileSizeBytes(),
      },
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          try {
            callback(
              null,
              ensureUploadTargetDir(process.env.UPLOAD_DIR, 'eft-dekont'),
            );
          } catch (error) {
            callback(error as Error, '');
          }
        },
        filename: (_request, file, callback) => {
          try {
            callback(
              null,
              createStoredReceiptFilename(file.originalname, file.mimetype),
            );
          } catch (error) {
            callback(error as Error, '');
          }
        },
      }),
    }),
  )
  uploadBankTransferReceipt(
    @Param('orderNumber') orderNumber: string,
    @Body() dto: UploadBankTransferReceiptDto,
    @UploadedFile()
    file: {
      filename: string;
      mimetype: string;
      originalname: string;
      path: string;
      size: number;
    } | null,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Dekont dosyasi secmelisiniz.');
    }

    return this.ordersService.uploadBankTransferReceipt(
      orderNumber,
      dto,
      file,
      request,
    );
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
