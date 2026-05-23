# KashmirConnect

**Free digital storefronts for Kashmir's small businesses** — artisans, farmers, tourism operators, and local brands.

KashmirConnect helps merchants build a credible online presence, earn customer trust through verifiable badges, capture leads and orders, and grow with analytics and AI guidance. The platform is designed for **zero cost to merchants and customers**: no subscriptions, no payment gateway, and no paid feature tiers.

**Repository:** [github.com/MohammadUsman00/Kashmir_Connect](https://github.com/MohammadUsman00/Kashmir_Connect)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Quality checks](#quality-checks)
- [Further documentation](#further-documentation)

---

## Features

### For merchants (dashboard)

| Area | Capabilities |
|------|----------------|
| **Account** | Register, login, email password reset, profile (EN / Urdu) |
| **Storefront** | Create and edit business page, publish/unpublish, sector templates, cover/logo upload |
| **Products** | Up to 10 products (free tier), reorder, hide/show, stock count, multi-image gallery, CSV import |
| **Customers** | View and manage **leads** and **order requests** from public pages |
| **Reviews** | Approve or hide customer reviews before they appear publicly |
| **Trust** | Request authenticity badge, download verification QR |
| **Growth** | Analytics (views, WhatsApp clicks, top products, daily chart), CSV export |
| **AI advisor** | Gemini-powered chat with history, suggested prompts, monthly usage limit |
| **Sharing** | Copy link, WhatsApp share kit, storefront QR code |
| **App** | Dark mode, in-app notifications, PWA install |

### For customers (public)

| Page | URL | Capabilities |
|------|-----|----------------|
| **Landing** | `/` | Product overview and sign-up |
| **Explore** | `/explore` | Browse active storefronts (featured and verified ranked first) |
| **Storefront** | `/s/:slug` | Products, categories, reviews, order request, leave a review, WhatsApp |
| **Badge verify** | `/verify/:code` | Confirm business authenticity |

### For platform admins

- Review pending badge applications (approve / reject with reason)
- Feature storefronts on Explore
- Platform statistics (storefronts, products, leads, orders, verified badges)

### Platform safeguards

- Rate limiting on auth, advisor, analytics, leads, orders, and reviews
- Row Level Security (RLS) on Supabase tables
- Optional transactional email via Resend (badge and activity alerts)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite 8, vanilla JavaScript (modular `src/`), shared KashmirConnect design system |
| **Backend** | Node.js, Express 4, Zod validation |
| **Data & auth** | Supabase (PostgreSQL, Auth, Storage) |
| **AI** | Google Gemini (`gemini-2.0-flash`) |
| **Integrations** | QRCode, Multer, Resend (optional) |

---

## Project structure

```
Kashmir_Connect/
├── frontend/          # Landing, dashboard, and public pages
│   ├── index.html     # Marketing landing
│   ├── app.html       # Merchant dashboard
│   ├── explore.html   # Public marketplace
│   ├── storefront.html
│   ├── verify.html
│   └── src/           # services, views, lib, styles, ui
├── backend/           # REST API
│   ├── src/           # routes, controllers, middleware, utils
│   └── supabase/
│       ├── schema.sql              # Full database schema + RLS
│       └── migrations/             # Incremental migrations
├── scripts/
│   └── qa-check.mjs   # Static build and wiring checks
└── render.yaml        # Render.com deployment blueprint
```

---

## Architecture

The codebase is split into a **static frontend** and a **stateless API**, connected through a typed service layer on the client.

**Frontend modules**

- `src/config` — environment and API base URL
- `src/services` — domain API clients (`auth`, `storefront`, `products`, `orders`, …)
- `src/views` — dashboard tab renderers
- `src/lib` — i18n, sharing, meta/SEO, auth hash handling
- `src/ui` — shared navigation, toasts
- `src/styles` — `kc-theme`, `kc-base`, `kc-components` (walnut / gold / cream)

**Backend modules**

- `src/routes` — HTTP surface (`/api/v1/*`)
- `src/controllers` — business logic
- `src/middleware` — JWT auth, admin role, validation, rate limits, errors
- `src/config` — Supabase (`supabase` for Auth, `db` service role for trusted server writes)

Authenticated API routes verify the user's JWT, enforce ownership, then perform database operations with the service-role client so Row Level Security does not block legitimate server-side writes.

---

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- (Optional) [Resend](https://resend.com) API key for email notifications

### 1. Database and storage (Supabase)

1. Open the Supabase **SQL Editor** and run the full script:
   ```
   backend/supabase/schema.sql
   ```
2. If you already applied an older schema, run only:
   ```
   backend/supabase/migrations/002_platform_features.sql
   ```
3. Create **public** storage buckets:
   - `storefront-images`
   - `product-images`
   - `qr-codes`
4. **Admin user:** Supabase → Authentication → Users → select user → **App Metadata**:
   ```json
   { "role": "admin" }
   ```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase and Gemini keys
npm run dev
```

Health check: `GET http://localhost:3000/health`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000/api/v1
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (landing) and [http://localhost:5173/app.html](http://localhost:5173/app.html) (dashboard).

Vite dev server rewrites `/explore`, `/s/:slug`, and `/verify/:code` to the correct HTML entry points.

---

## Deployment

The stack is designed for **free-tier hosting**: Supabase, Gemini, Vercel (frontend), and Render or Railway (backend). There is no in-app billing or checkout.

### Recommended: Vercel + Render

| Service | Root | Build | Start / output |
|---------|------|-------|----------------|
| **API** | `backend` | `npm install` | `npm start` |
| **Web** | `frontend` | `npm run build` | `dist` (static) |

1. Deploy the backend and note its URL (e.g. `https://kashmirconnect-api.onrender.com`).
2. Set backend env vars (see [Environment variables](#environment-variables)).  
   `ALLOWED_ORIGINS` and `PUBLIC_APP_URL` must match your frontend URL.
3. Deploy the frontend with `VITE_API_BASE_URL=https://<api-host>/api/v1`.
4. `frontend/vercel.json` includes rewrites for public routes.

### Alternative: Render blueprint

Use the root [`render.yaml`](render.yaml) to provision API and static site together. Configure secrets in the Render dashboard after deploy.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Anon key (Auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role (server DB/storage) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Default: `gemini-2.0-flash` |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend origins (CORS) |
| `PUBLIC_APP_URL` | Yes | Public site URL (QR links, password reset) |
| `FREE_TIER_AI_LIMIT` | No | Monthly AI queries per user (default: `5`) |
| `RESEND_API_KEY` | No | Email notifications |
| `RESEND_FROM` | No | Sender address for Resend |
| `PORT` | No | Default: `3000` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API base, e.g. `http://localhost:3000/api/v1` |

---

## API overview

Base path: `/api/v1`

| Prefix | Purpose |
|--------|---------|
| `/auth` | Register, login, profile, forgot/update password |
| `/storefronts` | CRUD, public page, explore, images, share QR |
| `/products` | Catalog, reorder, images, gallery |
| `/import` | CSV product import |
| `/leads` | Customer inquiries |
| `/orders` | Order requests |
| `/reviews` | Public submit, owner approval |
| `/notifications` | In-app notification feed |
| `/badges` | Request, verify, admin review |
| `/analytics` | Event recording, merchant dashboard stats |
| `/advisor` | AI chat (SSE stream) |
| `/admin` | Stats, feature storefronts, badge moderation |

Detailed route documentation: [`backend/README.md`](backend/README.md)

---

## Quality checks

Run static checks (file wiring + production build) without Supabase credentials:

```bash
node scripts/qa-check.mjs
```

Manual smoke test after configuring `.env`:

1. Register → create storefront → add product → publish  
2. Visit `/s/<slug>` → submit order and review  
3. Dashboard → approve review, check notifications  
4. Confirm analytics increment after a public page view  

---

## Further documentation

- [`backend/README.md`](backend/README.md) — API implementation notes  
- [`frontend/README.md`](frontend/README.md) — Pages, build, and frontend structure  

---

## Cost model

KashmirConnect is built to run on free tiers and remain **free for all users**:

- Merchants: full dashboard, storefront, badge, AI advisor (within monthly limit), analytics  
- Customers: browse, inquire, request orders, leave reviews — no payment step in the app  
- Operators: optional Resend email; no Razorpay, Stripe, or subscription UI  

Usage limits (e.g. 10 products per storefront, AI query cap) protect infrastructure on shared free hosting.

---

## Contributing

1. Fork the repository and create a feature branch.  
2. Run `node scripts/qa-check.mjs` before opening a pull request.  
3. Keep changes scoped; match existing module and naming conventions.  
4. Do not commit `.env` files or secrets.

---

*Built for Kashmir's local economy — credible storefronts, real customer connections, zero platform fees.*
