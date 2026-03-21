import { static as expressStatic } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ensureUploadRoot } from './media/media.utils';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadRoot = ensureUploadRoot(process.env.UPLOAD_DIR);

  app.set('trust proxy', true);
  app.set('etag', 'strong');
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'robots.txt', method: RequestMethod.GET },
      { path: 'sitemap.xml', method: RequestMethod.GET },
    ],
  });
  app.use(
    '/uploads',
    expressStatic(uploadRoot, {
      etag: true,
      maxAge: '7d',
    }),
  );
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
