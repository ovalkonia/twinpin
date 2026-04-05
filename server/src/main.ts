import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { User } from './users/entities/user.entity';
import { Company } from './companies/entities/company.entity';
import { Event } from './events/entities/event.entity';
import { Ticket } from './tickets/entities/ticket.entity';
import { Booking } from './bookings/entities/booking.entity';
import { Notification } from './notifications/entities/notification.entity';
import { PromoCode } from './promo-codes/entities/promo-code.entity';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // -----------------------------------------------------------------------
  // Register a /admin placeholder on the raw Express instance immediately
  // after app creation — before NestJS registers its routes and not-found
  // handler during app.init(). This guarantees the admin router sits first
  // in Express's middleware stack, ahead of NestJS's catch-all 404 handler.
  // The real AdminJS router is assigned to `adminRouter` after app.init().
  // -----------------------------------------------------------------------
  const expressApp = app.getHttpAdapter().getInstance();
  let adminRouter: any = null;
  expressApp.use('/admin', (req: any, res: any, next: any) => {
    if (adminRouter) adminRouter(req, res, next);
    else next();
  });

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

  // Initialize NestJS DI — registers routes and not-found handler.
  // Must complete before we build the admin router (needs UsersService + DataSource).
  // Server does NOT start listening here.
  await app.init();

  adminRouter = await buildAdminRouter(
    app.get(UsersService),
    app.get(DataSource),
    app.get(ConfigService),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

async function buildAdminRouter(
  usersService: UsersService,
  dataSource: DataSource,
  configService: ConfigService,
) {
  // All three are ESM-only — dynamic import() is required in a CJS NestJS build.
  const { default: AdminJS } = await import('adminjs');
  const { buildAuthenticatedRouter } = await import('@adminjs/express');
  const { Database, Resource } = await import('@adminjs/typeorm');

  // @adminjs/typeorm v5 is built entirely around BaseEntity static/instance methods.
  // Our entities use NestJS repository injection instead — patch every method that
  // Resource.js calls on `this.model` (static) or on entity instances (prototype).
  const managedEntities = [User, Company, Event, Ticket, Booking, Notification, PromoCode];
  for (const entity of managedEntities) {
    const repo = () => dataSource.getRepository(entity);
    // Static methods (called as EntityClass.method())
    (entity as any).getRepository = repo;
    (entity as any).find       = (opts?: any)  => repo().find(opts);
    (entity as any).findBy     = (where: any)  => repo().findBy(where);
    (entity as any).findOne    = (opts: any)   => repo().findOne(opts);
    (entity as any).findOneBy  = (where: any)  => repo().findOneBy(where);
    (entity as any).count      = (opts?: any)  => repo().count(opts);
    (entity as any).create     = (like?: any)  => repo().create(like);
    // Instance methods (called on entity objects returned by find/findOneBy)
    (entity as any).prototype.save   = function(opts?: any) { return repo().save(this, opts); };
    (entity as any).prototype.remove = function(opts?: any) { return repo().remove(this, opts); };
  }

  AdminJS.registerAdapter({ Database, Resource });

  const secret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');

  const admin = new AdminJS({
    rootPath: '/admin',
    resources: [
      {
        resource: User,
        options: {
          properties: {
            password: { isVisible: false },
          },
          listProperties: ['id', 'email', 'name', 'role', 'profilePublic', 'created_at'],
          showProperties: ['id', 'email', 'name', 'role', 'profilePublic', 'avatarUrl', 'created_at', 'updated_at'],
          editProperties: ['email', 'name', 'role', 'profilePublic'],
          filterProperties: ['email', 'name', 'role'],
        },
      },
      {
        resource: Company,
        options: {
          properties: {
            // simple-array is not in @adminjs/typeorm's DATA_TYPES — hide to avoid render errors
            categories: { isVisible: false },
          },
          listProperties: ['id', 'name', 'slug', 'email', 'created_at'],
          showProperties: ['id', 'name', 'slug', 'description', 'email', 'website', 'address', 'linkedin', 'instagram', 'tiktok', 'telegram', 'created_at'],
          editProperties: ['name', 'slug', 'description', 'email', 'website', 'address', 'linkedin', 'instagram', 'tiktok', 'telegram'],
          filterProperties: ['name', 'slug', 'email'],
        },
      },
      {
        resource: Event,
        options: {
          properties: {
            // simple-array columns — hide for same reason
            photos: { isVisible: false },
          },
          listProperties: ['id', 'title', 'category', 'status', 'date', 'location'],
          showProperties: ['id', 'title', 'description', 'format', 'category', 'tags', 'status', 'date', 'endDate', 'location', 'visitorListPrivacy', 'notifyOnNewVisitor', 'publishAt'],
          editProperties: ['title', 'description', 'format', 'category', 'status', 'date', 'endDate', 'location', 'visitorListPrivacy', 'notifyOnNewVisitor'],
          filterProperties: ['title', 'category', 'status', 'date'],
        },
      },
      {
        resource: Ticket,
        options: {
          listProperties: ['id', 'name', 'price', 'currency', 'quantityAvailable', 'isDefault'],
          editProperties: ['name', 'description', 'price', 'currency', 'quantityAvailable', 'sortOrder', 'isDefault'],
          filterProperties: ['name', 'currency', 'isDefault'],
        },
      },
      {
        resource: Booking,
        options: {
          // Read-only — mutations must go through business logic
          actions: {
            new: { isAccessible: false },
            edit: { isAccessible: false },
            delete: { isAccessible: false },
            bulkDelete: { isAccessible: false },
          },
          listProperties: ['id', 'quantity', 'paymentStatus', 'ticketCode', 'usedAt', 'hidden', 'createdAt'],
          filterProperties: ['paymentStatus', 'hidden', 'createdAt'],
        },
      },
      {
        resource: Notification,
        options: {
          actions: {
            new: { isAccessible: false },
            edit: { isAccessible: false },
          },
          listProperties: ['id', 'type', 'message', 'read', 'createdAt'],
          filterProperties: ['type', 'read', 'createdAt'],
        },
      },
      {
        resource: PromoCode,
        options: {
          listProperties: ['id', 'code', 'discount', 'discountType', 'isActive', 'usedCount', 'maxUses', 'validUntil'],
          editProperties: ['code', 'discount', 'discountType', 'isActive', 'maxUses', 'validUntil'],
          filterProperties: ['code', 'discountType', 'isActive'],
        },
      },
    ],
  });

  return buildAuthenticatedRouter(
    admin,
    {
      authenticate: async (email: string, password: string) => {
        try {
          const user = await usersService.findByEmail(email);
          if (user.role !== 'admin') return null;
          const valid = await bcrypt.compare(password, user.password);
          return valid ? { email: user.email, id: String(user.id) } : null;
        } catch {
          // findByEmail throws NotFoundException for unknown emails
          return null;
        }
      },
      cookieName: 'adminjs',
      cookiePassword: secret,
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    },
  );
}

bootstrap();
