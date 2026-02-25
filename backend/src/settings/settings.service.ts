import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Setting } from './setting.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

const PUBLIC_SETTING_KEYS = [
  'storeName',
  'supportEmail',
  'currency',
  'timezone',
  'taxRate',
  'websiteConfig',
] as const;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

  async findAll() {
    const records = await this.settingsRepository.find({
      order: {
        key: 'ASC',
      },
    });

    return this.toRecord(records);
  }

  async findPublic() {
    const records = await this.settingsRepository.find({
      where: {
        key: In([...PUBLIC_SETTING_KEYS]),
      },
      order: {
        key: 'ASC',
      },
    });

    return this.toRecord(records);
  }

  async update(payload: UpdateSettingsDto) {
    const updates = Object.entries(payload).filter(([, value]) => value !== undefined);

    await Promise.all(
      updates.map(async ([key, rawValue]) => {
        const value = String(rawValue);
        const existing = await this.settingsRepository.findOne({ where: { key } });

        if (existing) {
          existing.value = value;
          await this.settingsRepository.save(existing);
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

    const all = await this.findAll();

    await this.realtimeEventsService.emit('settings.updated', {
      settings: all,
      updatedAt: new Date().toISOString(),
    });

    return all;
  }

  private toRecord(records: Setting[]) {
    return records.reduce<Record<string, string>>((accumulator, current) => {
      accumulator[current.key] = current.value;
      return accumulator;
    }, {});
  }
}
