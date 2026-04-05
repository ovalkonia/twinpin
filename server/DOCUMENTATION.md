# Twinpin Server — Documentation

## What It Is

The Twinpin server is a REST API built with NestJS. It is the backend of the Twinpin event platform — handling user authentication, company and event management, ticket booking, promo codes, image uploads, transactional email, and a real-time-style notification system. The full interactive API reference is available at `/api/docs` (Swagger UI) when the server is running.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Node.js + TypeScript) |
| Database | PostgreSQL via TypeORM (`synchronize: true` in dev) |
| Authentication | Passport.js — JWT strategy + Google OAuth2 strategy |
| Password hashing | bcryptjs |
| File uploads | multer (`memoryStorage`) → Cloudinary CDN |
| Email | Resend |
| Validation | class-validator + class-transformer (global `ValidationPipe`) |
| API docs | @nestjs/swagger (Swagger UI at `/api/docs`) |

---

## Architecture Overview

The server follows NestJS's module pattern. Each feature domain is a self-contained module with its own controller, service, entities, and DTOs. All modules are registered in `AppModule`.

```
AppModule
  ├── AuthModule          JWT + Google OAuth2, PassportJS strategies
  ├── UsersModule         User CRUD, avatar upload, ticket visibility
  ├── CompaniesModule     Company profiles, members, image upload
  ├── EventsModule        Event lifecycle, bookings, comments, tickets, watch
  ├── TicketsModule       Ticket tiers per event
  ├── BookingsModule      Purchase records, Stripe simulation
  ├── EventCommentsModule Comments on events
  ├── NotificationsModule User notification CRUD + email fan-out
  ├── EventSubscriptionsModule  User watches an event (notification sub)
  ├── CompanyFollowsModule      User follows a company
  ├── OrganizerFollowsModule    Legacy user→user follow
  ├── PromoCodesModule    Promo codes per event (percentage / fixed)
  ├── CloudinaryModule    Global image upload service (@Global)
  └── MailModule          Transactional email via Resend
```

### Request lifecycle

```
HTTP request
  → CORS check (URL_FRONTEND whitelist)
  → cookieParser middleware
  → Global ValidationPipe (whitelist: true, transform: true)
  → Route guard (JwtAuthGuard / OptionalJwtAuthGuard / no guard)
  → Controller method
  → Service method
  → TypeORM repository
  → Response serialised and returned
```

---

## Database Schema

All tables are created automatically by TypeORM (`synchronize: true`).

```
users
  id (int PK), email (unique), password (hashed), name,
  avatarUrl, profilePublic, role (user | organizer | admin)

companies
  id (int PK), name, slug (unique), description, categories,
  logoUrl, coverUrl, email, website, address, linkedin,
  instagram, tiktok, telegram
  → owner (FK → users)
  → members (M2M → users via company_members)

events
  id (uuid PK), title, description, format (online | offline),
  category, tags, date, endDate, location, lat, lng,
  price, currency, capacity, coverUrl, photos, status (draft | published | cancelled),
  visitorListPrivacy, notifyOnNewVisitor, redirectAfterPurchase, publishAt
  → company (FK → companies)

tickets
  id (uuid PK), name, price, currency, quantityAvailable,
  isDefault, sortOrder
  → event (FK → events)

bookings
  id (uuid PK), quantity, stripePaymentIntentId, paymentStatus,
  hidden (bool, default false)
  → user (FK → users), ticket (FK → tickets)
  UNIQUE (user, ticket)

event_subscriptions
  id (uuid PK), createdAt
  → user (FK → users), event (FK → events)
  UNIQUE (user, event)

company_follows
  id (uuid PK), createdAt
  → user (FK → users), company (FK → companies)
  UNIQUE (user, company)

event_comments
  id (uuid PK), body, createdAt
  → author (FK → users, eager), event (FK → events)

notifications
  id (uuid PK), type, message, read (bool), createdAt
  → user (FK → users)

promo_codes
  id (uuid PK), code, discount, discountType, validUntil,
  maxUses, usedCount, active
  → event (FK → events)
  UNIQUE (event, code)

organizer_follows
  id (uuid PK)
  → follower (FK → users), organizer (FK → users)
  UNIQUE (follower, organizer)
```

---

## Algorithms and Key Flows

### 1. Email/Password Authentication

```
POST /auth/register { email, password, name? }
  → UsersService.create()
      → bcrypt.hash(password, 10)
      → userRepo.save({ email, hashedPassword, name })
  → authService.signToken(user)
      → jwt.sign({ sub: user.id, email }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY })
  → return { access_token, user }

POST /auth/login { email, password }
  → UsersService.findByEmail(email)   ← throws 404 if not found
  → bcrypt.compare(password, user.password)
  → if mismatch → throw UnauthorizedException
  → authService.signToken(user)
  → set httpOnly cookie access_token (1 day)
  → return { access_token, user }
```

---

### 2. Google OAuth2 Flow

```
GET /auth/google
  → PassportJS GoogleStrategy redirects browser to Google

Google redirects to GET /auth/google/callback
  → GoogleStrategy.validate(accessToken, refreshToken, profile)
      → extract email, firstName, lastName from profile
      → UsersService.findOrCreate(email, name)
          → if user exists: return existing
          → if not: create with role=user, no password
  → AuthService.googleLogin(googleUser)
      → signToken(user)
  → server redirects to:
      URL_FRONTEND/auth/callback?token=JWT&id=...&name=...&email=...
```

The client reads the JWT from the redirect URL query params — no extra API call.

---

### 3. JWT Validation on Every Protected Request

```
Request arrives with Authorization: Bearer <token>
  → JwtStrategy.validate(payload)
      → UsersService.findOne(payload.sub)   ← loads fresh user from DB
      → attaches user to req.user
  → Controller can access via @CurrentUser()

OptionalJwtAuthGuard:
  → same flow but does NOT throw if token is missing or invalid
  → req.user = undefined for unauthenticated requests
```

---

### 4. Ticket Booking Flow

```
POST /events/:id/subscribe?ticketId=&quantity=&hidden=&promoCode=

EventsService.subscribe(userId, eventId, ticketId, quantity, hidden, promoCode)
  1. Load event → throw 404 if not found or not published
  2. Load ticket tier:
       - if ticketId provided → use that tier
       - else → use the default tier (isDefault: true)
  3. Check availability:
       - if quantityAvailable set:
           count existing bookings for this tier
           if count + quantity > quantityAvailable → throw BadRequest
  4. Promo code (if provided):
       PromoCodesService.validate(eventId, code)
         → check active, not expired, usedCount < maxUses
       Calculate discounted price:
         - percentage: price * (1 - discount/100) * quantity
         - fixed: (price - discount) * quantity
  5. BookingsService.recordPurchase({ userId, event, tier, quantity, hidden, finalAmount })
       → StripePaymentSimulationService.simulate(amount, currency)
           → generates fake stripePaymentIntentId
       → bookingRepo.save({ user, ticket, quantity, hidden, stripePaymentIntentId })
       → NotificationsService.notifyUser(userId, 'event_booking', message)
       → if event.notifyOnNewVisitor:
           NotificationsService.notifyUser(organizerId, 'event_new_visitor', message)
  6. If promo code used:
       PromoCodesService.redeem(promoCodeId)   → usedCount++
```

---

### 5. Notification Fan-Out Algorithm

When something happens on an event or company, all subscribers/followers are notified:

```
// New comment posted
EventCommentsService.addComment(eventId, userId, dto)
  → save comment to DB
  → EventSubscriptionsService.getSubscriberIds(eventId)
      → returns all user IDs watching this event
  → filter out the commenter (they don't notify themselves)
  → Promise.all(ids.map(id =>
        NotificationsService.notifyUser(id, 'event_comment', message)
    ))

// Event updated (title / date / location changed)
EventsService.update(...)
  → detect if title, date, or location changed
  → if changed:
      getSubscriberIds(eventId) → notify all watchers ('event_update')
  → if status changed to 'cancelled':
      getSubscriberIds(eventId) → notify all watchers ('event_cancelled')
  → if status changed to 'published':
      CompanyFollowsService.getFollowerIds(companyId)
      → notify all company followers ('company_new_event')

// Each NotificationsService.notifyUser():
  → save Notification row to DB
  → if type NOT in skip-email set:
      MailService.sendNotificationEmail(user.email, title, message, type)
```

The skip-email types (`event_booking`, `ticket_cancellation`, `company_new_event`, `event_new_visitor`) have their own dedicated transactional email — the generic notification email is suppressed for these.

---

### 6. File Upload Pipeline

Multer is configured with `memoryStorage` — files are never written to disk:

```
Request with multipart/form-data
  → FileFieldsInterceptor (multer, memoryStorage)
      → file stored in memory as Express.Multer.File (buffer + metadata)
  → Controller receives file via @UploadedFiles()
  → CloudinaryService.upload(file, folder)
      → cloudinary.uploader.upload_stream(folder, options)
      → streams buffer to Cloudinary
      → returns secure_url (CDN URL)
  → URL string passed to service for persistence
```

`CloudinaryModule` is `@Global()` — no explicit import needed in feature modules.

---

### 7. Promo Code Validation and Redemption

Validation is intentionally separated from redemption to allow the client to show a discount preview before the user commits:

```
// Step 1 — Preview (public, no auth)
POST /events/:id/promo-codes/validate { code }
  → PromoCodesService.validate(eventId, code)
      → find code where event = eventId AND code = code
      → if not found → throw NotFoundException
      → if not active → throw BadRequestException
      → if validUntil < now → throw BadRequestException
      → if maxUses set AND usedCount >= maxUses → throw BadRequestException
      → return { id, code, discount, discountType }  ← no side effects

// Step 2 — Redemption (happens inside booking, after payment succeeds)
PromoCodesService.redeem(promoCodeId)
  → UPDATE promo_codes SET usedCount = usedCount + 1 WHERE id = id
```

---

### 8. Event Lifecycle

```
Status transitions:
  draft ──→ published ──→ cancelled
     └──────────────────→ cancelled

draft:     visible only to the owner; not shown in public feed
published: visible to everyone; triggers 'company_new_event' notifications
cancelled: visible but bookings are disabled; triggers 'event_cancelled' notifications

publishAt (scheduled publish):
  → stored as a timestamp
  → a scheduled job (or manual publish) sets status = 'published' at that time
```

---

### 9. Attendee List Privacy

```
GET /events/:id/attendees

EventsService.getAttendees(eventId, requestingUser)
  1. Load event
  2. If visitorListPrivacy = 'attendees':
       if requestingUser is null → return []
       check if requestingUser has a booking for this event
       if no booking → return []
  3. BookingsService.findForAttendeeList(eventId)
       → SELECT bookings WHERE event = eventId AND hidden = false
       → join user profile
  4. For each attendee:
       if user.profilePublic = false AND user.id ≠ requestingUser.id:
         mask name as 'Anonymous', set avatarUrl = null
  5. Return attendee list
```

---

## Notification Types Reference

| Type | Trigger | Email sent |
|---|---|---|
| `event_booking` | User books a ticket | Yes (dedicated booking email) |
| `event_new_visitor` | Organizer's event gets a new booking | Yes (dedicated email) |
| `event_comment` | New comment on a watched event | Yes (generic notification email) |
| `event_update` | Title / date / location changed on watched event | Yes |
| `event_cancelled` | Watched event is cancelled | Yes |
| `company_new_event` | Followed company publishes a new event | Yes (dedicated email) |

---

## API Reference

Full interactive documentation with request/response schemas, parameter descriptions, and the ability to test endpoints live is available at:

```
http://localhost:3000/api/docs
```

Click **Authorize** in the top-right corner and paste your JWT (obtained from `POST /auth/login`) to test protected endpoints directly from the browser.

### Endpoint groups

| Tag | Base path | Auth |
|---|---|---|
| auth | `/auth` | Public |
| users | `/users` | Mixed |
| companies | `/companies` | Mixed |
| events | `/events` | Mixed |
| promo-codes | `/events/:id/promo-codes` | Mixed |
| bookings | `/bookings` | JWT required |
| notifications | `/notifications` | JWT required |
| organizers | `/organizers` | JWT required |