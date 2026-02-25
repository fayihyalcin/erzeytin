import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Socket, Server } from 'socket.io';
import { RealtimeEventsService } from './realtime-events.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/admin-live',
})
export class AdminGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(AdminGateway.name);
  private server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly realtimeEventsService: RealtimeEventsService,
  ) {}

  async afterInit(server: Server) {
    this.server = server;

    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    try {
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);
      server.adapter(createAdapter(pubClient, subClient));
      this.logger.log('Socket.io Redis adapter aktif.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Redis adapter pasif: ${message}`);
    }

    this.realtimeEventsService.onEvent(({ event, data }) => {
      this.server.emit(event, data);
    });
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    try {
      const tokenFromAuth =
        typeof socket.handshake.auth?.token === 'string'
          ? socket.handshake.auth.token
          : undefined;
      const tokenFromQuery =
        typeof socket.handshake.query?.token === 'string'
          ? socket.handshake.query.token
          : undefined;
      const rawToken = tokenFromAuth ?? tokenFromQuery;

      if (!rawToken) {
        throw new UnauthorizedException('Socket token gerekli.');
      }

      const token = rawToken.replace(/^Bearer\s+/i, '');
      this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev_jwt_secret'),
      });
    } catch {
      socket.disconnect(true);
    }
  }
}
