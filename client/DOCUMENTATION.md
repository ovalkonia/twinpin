# Twinpin Client — Documentation

## What It Is

The Twinpin client is a single-page application built with React 19 and TypeScript. It is the user-facing frontend of the Twinpin event platform — a web app where people discover events, book tickets, follow organizers, and manage their attendance. Organizers use the same app to create and manage their events and company profiles.

---

## Technology Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Routing | react-router-dom v7 |
| HTTP client | Axios (with JWT interceptor) |
| Payments | Stripe.js + @stripe/react-stripe-js |
| Google sign-in | @react-oauth/google |
| Notifications | react-hot-toast |
| QR codes | react-qr-code |
| Styling | Plain CSS (no UI library, no CSS modules) |

---

## Architecture Overview

```
Browser
  └── BrowserRouter
        └── AuthProvider           ← global auth state (user, isAuth, loading)
              └── AppContent
                    └── Routes     ← all page components
```

The app is structured around three layers:

**1. Context layer** — `AuthContext` is the single source of truth for the authenticated user. It exposes `{ user, isAuth, loading, login, logout }` to every component via `useAuth()`.

**2. Service layer** — All network calls go through typed service files in `src/services/`. They use a shared Axios instance that automatically attaches the JWT bearer token from localStorage.

**3. Page/component layer** — Each route maps to a page component that calls services directly. No global server state library (no Redux, no React Query) — each page manages its own local state.

---

## Module Map

```
src/
├── App.jsx                        # Router + AuthProvider setup
├── context/
│   └── AuthContext.tsx            # Global auth state
├── services/
│   ├── api.ts                     # Axios instance with Bearer interceptor
│   ├── token.ts                   # localStorage JWT helpers
│   ├── auth.ts                    # register, login, getUserProfile
│   ├── user.ts                    # profile, events, tickets, avatar
│   ├── events.ts                  # full event CRUD + booking + watch
│   └── company.ts                 # company CRUD + members + follow
├── pages/
│   ├── auth/                      # SignIn, SignUp, ForgotPassword, GoogleCallback
│   ├── home/                      # MainPage (event feed)
│   ├── profile/                   # ProfilePage
│   ├── tickets/                   # TicketsPage
│   ├── notifications/             # NotificationsPage
│   ├── company/                   # CompanyPage, RegisterCompanyPage, EditCompanyPage
│   ├── events/                    # EventPage, CreateEventPage
│   └── checkout/                  # CheckoutPage
├── components/
│   ├── Header/                    # header.tsx, BurgerMenu.tsx, Notification.tsx
│   └── TicketCard.tsx
└── assets/
    └── icons.tsx                  # shared SVG icon components
```

---

## Algorithms and Key Flows

### 1. Session Restore on Page Load

Every time the app loads, `AuthContext` runs `checkAuth()` before rendering any protected content:

```
App mounts
  → AuthContext useEffect fires
  → getToken() reads localStorage
  → if token exists:
      GET /users/me (with Bearer token)
      → success: setUser(data), isAuth = true
      → failure: removeToken(), isAuth = false
  → loading = false
  → Routes render
```

This ensures the user stays logged in across page refreshes without requiring a new login.

---

### 2. Email/Password Login Flow

```
User submits login form
  → loginUser({ email, password })
  → POST /auth/login
  → server returns { access_token, user }
  → saveToken(access_token) → localStorage['token']
  → login(access_token, user) in AuthContext
      → setUser(user), isAuth = true
  → navigate('/dashboard')
```

---

### 3. Google OAuth2 Login Flow

```
User clicks "Sign in with Google"
  → window.location.href = VITE_API_URL + '/auth/google'
  → browser redirects to Google consent page
  → user consents
  → Google redirects to server /auth/google/callback
  → server builds JWT, redirects to:
      VITE_FRONTEND/auth/callback?token=...&id=...&name=...&email=...
  → GoogleCallback.tsx reads URL params
  → useRef guard prevents React Strict Mode double-invoke
  → saveToken(token)
  → login(token, { id, name, email })
  → navigate('/dashboard')
```

No extra API call is needed — all user data comes in the redirect URL.

---

### 4. Ticket Booking (Checkout) Flow

```
User opens EventPage
  → getEventTickets(eventId) loads available tiers
  → user selects a tier and quantity
  → navigate('/checkout/:eventId')

CheckoutPage mounts
  → loads event details, selected tier
  → user optionally enters a promo code:
      POST /events/:id/promo-codes/validate { code }
      → success: promo state set, order summary updates
  → user optionally checks "Hide me from attendee list"
  → user submits payment form:
      POST /events/:id/subscribe?ticketId=&quantity=&hidden=&promoCode=
      → server simulates Stripe payment
      → booking created
      → notification sent to user (event_booking)
      → notification sent to organizer (event_new_visitor) if enabled
  → navigate('/tickets') on success
```

---

### 5. Notification System Flow

```
User opens NotificationsPage (or header dropdown)
  → GET /notifications
  → server returns list sorted newest-first
  → each notification has: type, message, date, read, category, title

User clicks a notification
  → PATCH /notifications/:id/read
  → notification marked as read in local state

User clicks "Mark all read"
  → PATCH /notifications/mark-all-read
  → all local notifications set to read: true
```

Notification categories are derived from the `type` field:
- `event_*` → category `event`
- `ticket_*` → category `ticket`
- anything else → category `system`

---

### 6. Event Watch / Company Follow Flow

Both features follow the same toggle pattern on EventPage:

```
Component mounts
  → getEventWatchStatus(eventId) → { watching: boolean }
  → getCompanyFollowStatus(companyId) → boolean

User clicks "Follow event"
  → watchEvent(eventId) → POST /events/:id/watch
  → setIsWatching(true) (optimistic update)

User clicks "Unfollow event"
  → unwatchEvent(eventId) → DELETE /events/:id/watch
  → setIsWatching(false)
```

Once following/watching, the user receives in-app (and email) notifications for:
- **Watch**: new comments, event updates (title/date/location), event cancellation
- **Follow**: new events published by the company

---

### 7. Ticket Visibility Toggle Flow

Users can hide their booking so they don't appear in the attendee list:

```
TicketsPage loads
  → getUserTickets(userId) → UserTicket[] (each has hidden: boolean)
  → renders TicketCard for each ticket
      → eye/eye-off button if onHiddenChange provided

User toggles visibility
  → setTicketHidden(userId, eventId, !current)
      → PATCH /users/me/tickets/:eventId { hidden }
  → optimistic local state update via setRaw()
```

The `id` in `UserTicket` is the **event UUID**, not the booking UUID — this is what gets passed to the PATCH endpoint.

---

### 8. File Upload Flow (Avatar, Company Images)

Multer only accepts `multipart/form-data`. The client handles this by building a `FormData` object instead of sending JSON:

```
User selects a file
  → FormData constructed with file + other fields appended
  → axios.patch('/users/:id/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
  → server uploads to Cloudinary, returns updated profile with new URL
  → UI re-renders with new image
```

---

## Route Reference

| Path | Component | Auth required |
|---|---|---|
| `/` | BeforeSignUp (landing) | No |
| `/auth/sign-in` | SignIn | No |
| `/auth/sign-up` | SignUp | No |
| `/auth/forgot-password` | ForgotPassword | No |
| `/auth/callback` | GoogleCallback | No |
| `/dashboard` | MainPage | No |
| `/events/:id` | EventPage | No |
| `/profile/:userId` | ProfilePage | Yes |
| `/tickets` | TicketsPage | Yes |
| `/notifications` | NotificationsPage | Yes |
| `/company` | CompanyPage | Yes |
| `/company/register` | RegisterCompanyPage | Yes |
| `/company/edit` | EditCompanyPage | Yes |
| `/checkout/:eventId` | CheckoutPage | Yes |
| `/events/create` | CreateEventPage | Yes |

---

## Auth Token Lifecycle

```
Login / Google callback
  → saveToken(jwt)        → localStorage['token']

Every API request
  → Axios interceptor reads getToken()
  → adds Authorization: Bearer <token> header automatically

Page refresh
  → AuthContext.checkAuth() validates token via GET /users/me

Logout
  → removeToken()         → removes from localStorage
  → setUser(null)         → isAuth = false
  → navigate('/')
```

Token expiry (default 1 day) is handled server-side — a 401 response on `GET /users/me` clears the token.