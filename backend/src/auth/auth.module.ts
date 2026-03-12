import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AdminUser } from '../users/admin-user.entity';

function resolveJwtExpiresIn(configService: ConfigService) {
  const rawValue =
    configService.get<string>('JWT_EXPIRES_IN') ??
    configService.get<string>('JWT_EXPIRES_IN_SECONDS');
  const trimmed = rawValue?.trim();

  if (!trimmed) {
    return '7d' as StringValue;
  }

  return /^\d+$/.test(trimmed)
    ? Number(trimmed)
    : (trimmed as StringValue);
}

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AdminUser]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev_jwt_secret'),
        signOptions: {
          expiresIn: resolveJwtExpiresIn(configService),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
