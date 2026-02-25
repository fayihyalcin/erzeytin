import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ADMIN_EVENTS_CHANNEL } from './realtime.constants';

@Injectable()
export class RealtimeEventsService implements OnModuleInit {
  private readonly listeners = new Set<
    (payload: { event: string; data: Record<string, unknown> }) => void
  >();

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    await this.redisService.subscribe(ADMIN_EVENTS_CHANNEL, (payload) => {
      const event = payload.event;
      const data = payload.data;

      if (typeof event !== 'string' || typeof data !== 'object' || !data) {
        return;
      }

      this.listeners.forEach((listener) => {
        listener({ event, data: data as Record<string, unknown> });
      });
    });
  }

  onEvent(
    listener: (payload: { event: string; data: Record<string, unknown> }) => void,
  ) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async emit(event: string, data: Record<string, unknown>) {
    await this.redisService.publish(ADMIN_EVENTS_CHANNEL, { event, data });
  }
}
