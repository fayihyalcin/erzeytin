import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../redis/redis.module';
import { AdminGateway } from './admin.gateway';
import { RealtimeEventsService } from './realtime-events.service';

@Module({
  imports: [ConfigModule, JwtModule, RedisModule],
  providers: [AdminGateway, RealtimeEventsService],
  exports: [RealtimeEventsService],
})
export class RealtimeModule {}
