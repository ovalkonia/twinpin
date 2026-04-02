import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Twinpin API')
    .setDescription('HTTP API for Twinpin')
    .setVersion('1.0')
    .addBearerAuth()
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