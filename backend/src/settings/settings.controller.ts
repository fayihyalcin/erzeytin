import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

type CurrentUserPayload = {
  sub: string;
  username: string;
  role: 'ADMIN' | 'REPRESENTATIVE';
};

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  private assertAdmin(user: CurrentUserPayload) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Sistem ayarlarina sadece admin erisebilir.');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: CurrentUserPayload) {
    this.assertAdmin(user);
    return this.settingsService.findAll();
  }

  @Get('public')
  findPublic() {
    return this.settingsService.findPublic();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);
    return this.settingsService.update(dto);
  }
}
