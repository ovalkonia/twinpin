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
import { Router } from 'express';
import session from 'express-session';

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

  // -----------------------------------------------------------------------
  // Session setup
  //
  // A single shared MemoryStore is used by both session middleware instances:
  // 1. The global one added by buildAuthenticatedRouter (for login / protected routes)
  // 2. The inline one applied to the OAuth callback route (runs before the global one)
  //
  // Without a shared store, the session written in the callback would be in a
  // different in-memory store than the one checked by withProtectedRoutesHandler,
  // so the admin would always be treated as unauthenticated.
  // -----------------------------------------------------------------------
  const sessionCookieName = 'adminjs';
  const sessionOptions = {
    resave: false,
    saveUninitialized: false,
    secret,
    store: new session.MemoryStore(),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    },
  };

  // Inline session middleware reused on the OAuth callback route
  const sessionMiddleware = session({ ...sessionOptions, name: sessionCookieName });

  const callbackUrl = `${configService.getOrThrow<string>('URL_BACKEND')}/admin/auth/google/callback`;

  // -----------------------------------------------------------------------
  // Predefined router — routes added here are processed BEFORE
  // buildAuthenticatedRouter registers its session middleware and its own
  // GET /login handler, so:
  //   • GET /login  → we inject the Google button, then AdminJS's POST /login
  //                   still handles form submission normally
  //   • GET /auth/google → no session needed, just a redirect
  //   • GET /auth/google/callback → session applied inline (shared store)
  // -----------------------------------------------------------------------
  const predefinedRouter = Router();

  // Custom login page — fully replaces AdminJS's React login SPA.
  // The POST /login handler from buildAuthenticatedRouter still runs normally
  // (formidable middleware is applied before it in the middleware chain).
  predefinedRouter.get('/login', (req: any, res: any) => {
    const error = req.query.error;
    res.send(adminLoginHtml({
      loginPath: admin.options.loginPath,
      googlePath: `${admin.options.rootPath}/auth/google`,
      error: error ? 'Invalid credentials' : null,
    }));
  });

  // Initiate Google OAuth — just a redirect, no session needed
  predefinedRouter.get('/auth/google', (_req: any, res: any) => {
    const params = new URLSearchParams({
      client_id: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      access_type: 'online',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // Handle Google callback — sessionMiddleware applied inline so req.session
  // is available; uses the shared store so the session is visible to the
  // global session middleware on subsequent protected-route requests.
  predefinedRouter.get('/auth/google/callback', sessionMiddleware, async (req: any, res: any) => {
    const loginPath = admin.options.loginPath;
    const { code } = req.query;
    if (!code) return res.redirect(loginPath);

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
          client_secret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
      if (!tokenData.access_token) throw new Error(tokenData.error ?? 'No access token');

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = await userRes.json() as { email?: string };
      if (!googleUser.email) throw new Error('No email from Google');

      const user = await usersService.findByEmail(googleUser.email);
      if (user.role !== 'admin') return res.redirect(loginPath);

      req.session.adminUser = { email: user.email, id: String(user.id) };
      req.session.save((err: any) => {
        if (err) return res.redirect(loginPath);
        res.redirect(admin.options.rootPath);
      });
    } catch {
      res.redirect(loginPath);
    }
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
          return null;
        }
      },
      cookieName: sessionCookieName,
      cookiePassword: secret,
    },
    predefinedRouter,
    sessionOptions,
  );
}

function adminLoginHtml({ loginPath, googlePath, error }: {
  loginPath: string;
  googlePath: string;
  error: string | null;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin — Sign in</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #111;
      border: 1px solid rgba(255,107,0,.15);
      border-radius: 16px;
      padding: 40px 36px;
      width: 100%;
      max-width: 380px;
    }
    .title {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 28px;
      text-align: center;
      letter-spacing: -.3px;
    }
    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 11px 0;
      background: #fff;
      color: #3c4043;
      border: 1px solid #dadce0;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: background .15s;
    }
    .google-btn:hover { background: #f5f5f5; }
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 22px 0;
      color: #555;
      font-size: 13px;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,.08);
    }
    input {
      display: block;
      width: 100%;
      padding: 11px 14px;
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 14px;
      margin-bottom: 12px;
      outline: none;
      transition: border-color .15s;
    }
    input:focus { border-color: rgba(255,107,0,.5); }
    input::placeholder { color: #555; }
    .submit-btn {
      width: 100%;
      padding: 11px 0;
      background: #ff6b00;
      color: #fff;
      border: none;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 4px;
      transition: background .15s;
    }
    .submit-btn:hover { background: #ff8533; }
    .error {
      background: rgba(255,59,48,.12);
      border: 1px solid rgba(255,59,48,.3);
      color: #ff6b6b;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 16px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Admin Panel</div>

    ${error ? `<div class="error">${error}</div>` : ''}

    <a href="${googlePath}" class="google-btn">
      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Sign in with Google
    </a>

    <div class="divider">or</div>

    <form method="POST" action="${loginPath}">
      <input type="email" name="email" placeholder="Email" required autocomplete="email" />
      <input type="password" name="password" placeholder="Password" required autocomplete="current-password" />
      <button type="submit" class="submit-btn">Sign in</button>
    </form>
  </div>
</body>
</html>`;
}

bootstrap();
