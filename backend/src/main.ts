import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const production = process.env.NODE_ENV === 'production';
  if (production && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in production.');
  }
  if (process.env.SUPABASE_URL && !/^https:\/\//i.test(process.env.SUPABASE_URL)) {
    throw new Error('SUPABASE_URL must start with https:// (SSL is enforced).');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: production ? ['error', 'warn', 'log'] : undefined,
  });

  // Behind Caddy on the VPS: trust exactly one proxy so client IPs (for rate limits) are real
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());

  // AI advisor snapshots are the largest requests; nothing legitimate is bigger than this
  app.useBodyParser('json', { limit: process.env.BODY_LIMIT || '2mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const defaults = production
    ? 'https://diasporaconnectt.com,https://www.diasporaconnectt.com'
    : 'https://diasporaconnectt.com,https://www.diasporaconnectt.com,http://localhost:5173';
  const origins = (process.env.CORS_ORIGINS || defaults)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: false,            // the portal sends a Bearer token, never cookies
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Diaspora Connect API listening on port ${port} (CORS: ${origins.join(', ')})`);
}
bootstrap();
