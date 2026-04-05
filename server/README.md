# Twinpin — Server

A NestJS REST API powering the Twinpin event platform. Handles authentication, event lifecycle, ticket booking, promo codes, image uploads, transactional email, and a fan-out notification system.

## Features

- JWT authentication and Google OAuth2 (server-side redirect flow)
- Company and event management with multi-file image uploads (Cloudinary)
- Ticket tiers per event with quantity tracking
- Ticket booking with Stripe payment simulation and promo code redemption
- Event watch / company follow notification system (fan-out on comment, update, cancel, publish)
- Attendee visibility control (hidden bookings)
- Transactional email via Resend
- Interactive API docs via Swagger at `/api/docs`

## Requirements

| Requirement | Version / Notes |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| PostgreSQL | ≥ 14 (local install or Docker) |
| Cloudinary account | For image uploads |
| Google Cloud project | OAuth2 credentials for Google login |
| Resend account | For transactional emails |

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| @nestjs/core | ^11.0.1 | NestJS framework |
| @nestjs/typeorm | ^11.0.0 | TypeORM integration |
| typeorm | ^0.3.28 | ORM / query builder |
| pg | ^8.20.0 | PostgreSQL driver |
| @nestjs/jwt | ^11.0.2 | JWT signing / verification |
| passport-jwt | ^4.0.1 | JWT Passport strategy |
| passport-google-oauth20 | ^2.0.0 | Google OAuth2 Passport strategy |
| bcryptjs | ^3.0.3 | Password hashing |
| cloudinary | ^2.9.0 | Image upload and storage |
| resend | ^6.10.0 | Transactional email |
| @nestjs/swagger | ^11.2.6 | OpenAPI / Swagger docs |
| class-validator | ^0.14.4 | DTO validation |
| class-transformer | ^0.5.1 | DTO transformation |
| qrcode | ^1.5.4 | QR code generation |
| cookie-parser | ^1.4.7 | Cookie middleware |

**Dev tooling:** @nestjs/cli, jest, ts-jest, eslint, prettier, TypeScript ^5

## Environment Variables

The server reads from a single `.env` file at the **repo root** (not inside `server/`). Copy the example and fill in your values:

```bash
# from the repo root
cp .env.example .env
```

Server-specific variables:

| Variable | Description |
|---|---|
| `URL_BACKEND` | This server's public URL (e.g. `http://localhost:3000`) |
| `URL_FRONTEND` | Frontend URL(s) for CORS — comma-separated if multiple |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `DB_HOST` | Database host (e.g. `localhost` or Docker service name) |
| `DB_PORT` | Database port (default `5432`) |
| `JWT_ACCESS_SECRET` | Secret used to sign JWTs |
| `JWT_ACCESS_EXPIRY` | JWT expiry duration (e.g. `1d`) |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_URL` | Full Cloudinary URL (`cloudinary://key:secret@cloud`) |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Sender address (e.g. `Twinpin <noreply@yourdomain.com>`) |

## How to Run

### 1. Clone the repository

```bash
git clone <repo-url>
cd twinpin
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in all server-side variables listed above.

### 3. Set up PostgreSQL

Create the database (name must match `POSTGRES_DB` in `.env`):

```bash
psql -U postgres -c "CREATE DATABASE twinpin;"
```

Or run PostgreSQL in Docker:

```bash
docker run -d \
  --name twinpin-db \
  -e POSTGRES_USER=twinpin \
  -e POSTGRES_PASSWORD=twinpin \
  -e POSTGRES_DB=twinpin \
  -p 5432:5432 \
  postgres:16
```

> The server uses TypeORM with `synchronize: true` in development — tables are created automatically on first run. No manual migrations needed.

### 4. Install dependencies

```bash
cd server
npm install
```

### 5. Start the development server

```bash
npm run start:dev
```

The API will be available at **http://localhost:3000**.  
Swagger docs: **http://localhost:3000/api/docs**

## Available Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Dev server with hot-reload (watch mode) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run compiled production output |
| `npm run lint` | ESLint with auto-fix |
| `npm run test` | Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:cov` | Jest with coverage report |
| `npm run test:e2e` | End-to-end tests |

## API Overview

Full interactive documentation is available at `/api/docs` (Swagger UI) when the server is running.

| Area | Base path |
|---|---|
| Authentication | `/auth` |
| Users | `/users` |
| Companies | `/companies` |
| Events | `/events` |
| Tickets | `/events/:id/tickets` |
| Bookings | `/events/:id/subscribe` |
| Promo codes | `/events/:id/promo-codes` |
| Notifications | `/notifications` |