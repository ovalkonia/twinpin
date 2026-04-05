# Twinpin — Client

A React 19 + TypeScript single-page application for discovering, following, and booking events. Built with Vite and a fully custom dark-theme design system — no UI library.

## Features

- Browse and search events by category, date, and location
- Google OAuth2 and email/password authentication
- Book tickets with promo code support (percentage and fixed discounts)
- QR code ticket view on your tickets page
- Follow companies and watch events to receive in-app notifications
- Toggle attendee list visibility at checkout or from your tickets page
- Organizer dashboard: create/manage events and companies, manage team members

## Requirements

| Requirement | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Twinpin server | running on port 3000 — see [server/README.md](../server/README.md) |

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | ^19.2.0 | UI framework |
| react-dom | ^19.2.0 | DOM rendering |
| react-router-dom | ^7.13.1 | Client-side routing |
| axios | ^1.13.6 | HTTP client |
| @stripe/react-stripe-js | ^5.6.1 | Stripe payment UI components |
| @stripe/stripe-js | ^8.11.0 | Stripe.js loader |
| @react-oauth/google | ^0.13.4 | Google OAuth2 sign-in button |
| react-hot-toast | ^2.6.0 | Toast notifications |
| react-qr-code | ^2.0.18 | QR code rendering for tickets |

**Dev / build tooling:** Vite ^7.3.1, TypeScript ^5.9.3, ESLint ^9.39.1

## Environment Variables

The client reads from a single `.env` file at the **repo root** (not inside `client/`). Copy the example and fill in your values:

```bash
# from the repo root
cp .env.example .env
```

Client-specific variables:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:3000`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth2 client ID from Google Cloud Console |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key (event location display) |

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

Open `.env` and set at minimum:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### 3. Install dependencies

```bash
cd client
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

> The backend must be running before you start the client. See [server/README.md](../server/README.md).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot-reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |