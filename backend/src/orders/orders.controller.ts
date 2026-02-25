import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateShopOrderDto } from './dto/create-shop-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

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
