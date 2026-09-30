import 'dotenv/config';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });
  // In production nginx serves /uploads/ directly from the shared volume
  // (see nginx/nginx.conf) and this middleware never gets hit. In dev
  // (plain `pnpm dev`, no nginx) nothing else serves it, so without this
  // every uploaded image 404s and admin/site <img> tags stay broken.
  app.useStaticAssets(resolve(process.env.UPLOADS_DIR ?? './uploads'), {
    prefix: '/uploads/',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
