import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateRepresentativeDto } from './dto/create-representative.dto';
import { UpdateRepresentativeDto } from './dto/update-representative.dto';
import { UsersService } from './users.service';

type CurrentUserPayload = {
  sub: string;
  username: string;
  role: 'ADMIN' | 'REPRESENTATIVE';
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('representatives')
  findRepresentatives() {
    return this.usersService.findRepresentatives();
  }

  @Post('representatives')
  createRepresentative(
    @Body() dto: CreateRepresentativeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);
    return this.usersService.createRepresentative(dto);
  }

  @Patch('representatives/:id')
  updateRepresentative(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRepresentativeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);
    return this.usersService.updateRepresentative(id, dto);
  }

  private assertAdmin(user: CurrentUserPayload) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Bu islem sadece admin icin yetkilidir.');
    }
  }
}
