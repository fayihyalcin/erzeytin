import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    this.publisher = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.subscriber = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.publisher.on('error', (error) => {
      this.logger.warn(`Redis publish error: ${error.message}`);
    });

    this.subscriber.on('error', (error) => {
      this.logger.warn(`Redis subscribe error: ${error.message}`);
    });
  }

  async publish(channel: string, payload: Record<string, unknown>) {
    try {
      if (this.publisher.status === 'wait') {
        await this.publisher.connect();
      }

      await this.publisher.publish(channel, JSON.stringify(payload));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Redis publish skipped: ${message}`);
    }
  }

  async subscribe(
    channel: string,
    onMessage: (payload: Record<string, unknown>) => void,
  ) {
    try {
      if (this.subscriber.status === 'wait') {
        await this.subscriber.connect();
      }

      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (incomingChannel, rawPayload) => {
        if (incomingChannel !== channel) {
          return;
        }

        try {
          const parsed = JSON.parse(rawPayload) as Record<string, unknown>;
          onMessage(parsed);
        } catch {
          this.logger.warn('Redis payload parse edilemedi.');
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Redis subscribe skipped: ${message}`);
    }
  }

  async onModuleDestroy() {
    await Promise.allSettled([this.publisher.quit(), this.subscriber.quit()]);
  }
}
