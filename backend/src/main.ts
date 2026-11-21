import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in production.');
  }
  if (process.env.SUPABASE_URL && !/^https:\/\//i.test(process.env.SUPABASE_URL)) {
    throw new Error('SUPABASE_URL must start with https:// (SSL is enforced).');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind Caddy on the VPS: trust the proxy so client IPs are real
  app.set('trust proxy', 1);

  // AI advisor snapshots can exceed the 100 kB default
  app.useBodyParser('json', { limit: process.env.BODY_LIMIT || '15mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const origins = (process.env.CORS_ORIGINS || 'https://diasporaconnectt.com,https://www.diasporaconnectt.com,http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Diaspora Connect API listening on port ${port} (CORS: ${origins.join(', ')})`);
}
bootstrap();
