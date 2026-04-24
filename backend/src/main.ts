import {
  json as expressJson,
  static as expressStatic,
  urlencoded as expressUrlencoded,
} from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ensureUploadRoot, LEGACY_PUBLIC_UPLOAD_PATH, PUBLIC_UPLOAD_PATH } from './media/media.utils';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function resolveRequestBodyLimit() {
  const rawValue = process.env.REQUEST_BODY_LIMIT_MB?.trim();

  if (!rawValue) {
    return '50mb';
  }

  const raw = Number(rawValue);
  if (!Number.isFinite(raw) || raw <= 0) {
    return '50mb';
  }

  return `${raw}mb`;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const uploadRoot = ensureUploadRoot(process.env.UPLOAD_DIR);
  const requestBodyLimit = resolveRequestBodyLimit();

  app.set('trust proxy', true);
  app.set('etag', 'strong');
  app.use(expressJson({ limit: requestBodyLimit }));
  app.use(
    expressUrlencoded({
      extended: true,
      limit: requestBodyLimit,
    }),
  );
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'robots.txt', method: RequestMethod.GET },
      { path: 'sitemap.xml', method: RequestMethod.GET },
    ],
  });
  const uploadStaticOptions = {
    etag: true,
    maxAge: '7d',
  } as const;

  app.use(PUBLIC_UPLOAD_PATH, expressStatic(uploadRoot, uploadStaticOptions));
  app.use(LEGACY_PUBLIC_UPLOAD_PATH, expressStatic(uploadRoot, uploadStaticOptions));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
