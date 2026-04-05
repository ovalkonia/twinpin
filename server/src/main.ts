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
import { Router, urlencoded } from 'express';
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
  const urlFrontend = configService.getOrThrow<string>('URL_FRONTEND');

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

  const callbackUrl = `${urlFrontend}/admin/auth/google/callback`;

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

  const urlencodedParser = urlencoded({ extended: false });

  // Custom GET /login — replaces AdminJS's React SPA login page.
  predefinedRouter.get('/login', (req: any, res: any) => {
    res.send(adminLoginHtml({
      loginPath: admin.options.loginPath,
      googlePath: `${admin.options.rootPath}/auth/google`,
      error: req.query.error ? decodeURIComponent(req.query.error as string) : null,
    }));
  });

  // Custom POST /login — runs before AdminJS's handler so we control the error
  // redirect back to our page instead of AdminJS rendering its React page on failure.
  predefinedRouter.post('/login', sessionMiddleware, urlencodedParser, async (req: any, res: any) => {
    const loginPath = admin.options.loginPath;
    const { email, password } = req.body ?? {};
    try {
      const user = await usersService.findByEmail(email);
      if (user.role !== 'admin') throw new Error('forbidden');
      const valid = await bcrypt.compare(password ?? '', user.password);
      if (!valid) throw new Error('invalid');
      req.session.adminUser = { email: user.email, id: String(user.id) };
      req.session.save((err: any) => {
        if (err) return res.redirect(`${loginPath}?error=${encodeURIComponent('Something went wrong')}`);
        res.redirect(`${urlFrontend}${admin.options.rootPath}`);
      });
    } catch {
      res.redirect(`${loginPath}?error=${encodeURIComponent('Invalid credentials')}`);
    }
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
        res.redirect(`${urlFrontend}${admin.options.rootPath}`);
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
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* === header === */
    .site-header {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 24px;
      background: rgba(10,10,10,0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,107,0,0.2);
      z-index: 1000;
    }
    .site-header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      font-size: 18px;
      font-weight: 700;
      color: #e0e0e0;
      letter-spacing: 0.5px;
      transition: color 0.2s;
    }
    .site-header-brand:hover { color: #ff6b00; }

    /* === main (centers the card) === */
    .site-main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 88px 16px 32px;
    }

    /* === footer === */
    .site-footer {
      width: 100%;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: #0a0a0a;
      padding: 0 24px;
    }
    .site-footer-inner {
      max-width: 1100px;
      margin: 0 auto;
      height: 56px;
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .site-footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      color: #555;
      flex-shrink: 0;
    }
    .site-footer-links {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .site-footer-link {
      font-size: 12px;
      font-weight: 500;
      color: #444;
      text-decoration: none;
      transition: color 0.15s;
    }
    .site-footer-link:hover { color: #888; }
    .site-footer-copy {
      margin-left: auto;
      font-size: 12px;
      color: #333;
    }

    /* === card (matches .auth-card) === */
    .auth-card {
      background: #111;
      color: #e0e0e0;
      padding: 40px;
      border-radius: 16px;
      border: 1px solid rgba(255,107,0,0.3);
      box-shadow: 0 8px 30px rgba(255,107,0,0.12);
      width: 100%;
      max-width: 420px;
    }
    .auth-card h2 {
      color: #ff6b00;
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 28px;
      text-align: center;
    }

    /* === form === */
    .auth-card form {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .auth-card label {
      display: block;
      color: #ccc;
      font-size: 13px;
      font-weight: 500;
      margin-top: 10px;
      margin-bottom: 4px;
    }
    .auth-card input {
      width: 100%;
      padding: 11px 14px;
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 15px;
      transition: border-color 0.2s, background 0.2s;
    }
    .auth-card input:focus {
      outline: none;
      border-color: #ff6b00;
      background: #222;
    }
    .auth-card input::placeholder { color: #555; }

    /* === submit button (centered pill) === */
    .auth-card button[type="submit"] {
      align-self: center;
      min-width: 160px;
      padding: 12px 32px;
      margin: 30px auto 10px;
      background: #ff6b00;
      color: #fff;
      border: none;
      border-radius: 50px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .auth-card button[type="submit"]:hover { background: #ff8533; }

    /* === divider === */
    .auth-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 20px 0 0;
      color: #555;
      font-size: 13px;
    }
    .auth-divider::before, .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255,107,0,0.2);
    }

    /* === google button (matches client .google-btn) === */
    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 11px 16px;
      margin-top: 12px;
      background: #1e1e1e;
      border: 1px solid #333;
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.2s, background 0.2s;
    }
    .google-btn:hover {
      border-color: rgba(255,107,0,0.5);
      background: #222;
    }

    /* === toast (matches react-hot-toast config in App.jsx) === */
    #toast-container {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1a1a1a;
      color: #e0e0e0;
      border: 1px solid rgba(255,107,0,0.3);
      border-radius: 10px;
      font-size: 14px;
      padding: 12px 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      white-space: nowrap;
      max-width: 90vw;
      opacity: 0;
      transform: translateY(-12px);
      transition: opacity 0.25s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: auto;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast.hide { opacity: 0; transform: translateY(-12px); transition: opacity 0.2s, transform 0.2s; }
  </style>
</head>
<body>
  <div id="toast-container"></div>

  <header class="site-header">
    <a href="/dashboard" class="site-header-brand">Twinpin</a>
  </header>

  <main class="site-main">
  <div class="auth-card">
    <h2>Sign in</h2>

    <form method="POST" action="${loginPath}">
      <div class="input-group">
        <label for="email">Email</label>
        <input id="email" type="email" name="email" placeholder="example@mail.com" required autocomplete="email" />
      </div>
      <div class="input-group">
        <label for="password">Password</label>
        <input id="password" type="password" name="password" placeholder="••••••••" required autocomplete="current-password" />
      </div>
      <button type="submit">Sign in</button>
    </form>

    <div class="auth-divider"><span>or</span></div>

    <a href="${googlePath}" class="google-btn">
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </a>
  </div>
  </main>

  <footer class="site-footer">
    <div class="site-footer-inner">
      <a href="/dashboard" class="site-footer-brand">Twinpin</a>
      <nav class="site-footer-links">
        <a href="/info/rules" class="site-footer-link">Rules</a>
        <a href="/info/privacy" class="site-footer-link">Privacy</a>
        <a href="/info/faq" class="site-footer-link">Help</a>
      </nav>
      <p class="site-footer-copy">© 2026 Twinpin</p>
    </div>
  </footer>

  <script>
    function showToast(message, type) {
      var container = document.getElementById('toast-container');
      var toast = document.createElement('div');
      toast.className = 'toast';

      var errorIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="#ff4444" stroke-width="1.5"/><path d="M10 6v4.5" stroke="#ff4444" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="14" r="0.75" fill="#ff4444"/></svg>';
      var successIcon = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="#ff6b00" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4.5-5" stroke="#ff6b00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      toast.innerHTML = (type === 'error' ? errorIcon : successIcon) + '<span>' + message + '</span>';
      container.appendChild(toast);

      requestAnimationFrame(function() {
        requestAnimationFrame(function() { toast.classList.add('show'); });
      });

      setTimeout(function() {
        toast.classList.add('hide');
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 220);
      }, 4000);
    }

    // Show error toast if redirected back with ?error=
    var params = new URLSearchParams(window.location.search);
    var error = params.get('error');
    if (error) {
      showToast(error, 'error');
      history.replaceState({}, '', window.location.pathname);
    }
  </script>
</body>
</html>`;
}

bootstrap();
