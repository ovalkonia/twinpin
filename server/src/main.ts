import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Twinpin API')
    .setDescription(
      `REST API for the **Twinpin** event platform.\n\n` +
      `## Authentication\n` +
      `Most write endpoints require a JWT bearer token. Obtain one via \`POST /auth/login\` ` +
      `or the Google OAuth2 redirect flow (\`GET /auth/google\`).\n\n` +
      `## Key conventions\n` +
      `- \`/events/:id/subscribe\` — **ticket booking** (purchase)\n` +
      `- \`/events/:id/watch\` — **notification subscription** (watch for updates)\n` +
      `- Company and event IDs are UUIDs; user IDs are integers.\n\n` +
      `## Swagger UI\n` +
      `Click **Authorize** (top-right) and paste your JWT to test protected endpoints.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste the JWT returned by /auth/login' },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const frontend = process.env.URL_FRONTEND;
  const corsOrigin =
    !frontend || frontend === '*'
      ? true
      : frontend.split(',').map((o) => o.trim()).filter(Boolean);

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();