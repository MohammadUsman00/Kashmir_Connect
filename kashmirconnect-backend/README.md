# KashmirConnect Backend

Production-ready Node.js + Express backend for KashmirConnect, focused on small-business digital storefronts, authenticity badges with QR verification, analytics, and AI guidance using **Google Gemini free tier**.

## Tech Stack

- Node.js 20+
- Express.js
- Supabase (PostgreSQL + Auth + Storage)
- Google Gemini (`@google/genai`)
- Zod validation
- QR code generation (`qrcode`)

## 1) Setup

1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `cp .env.example .env` (or create manually on Windows)
3. Fill `.env` values:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Run DB schema in Supabase SQL editor:
   - `supabase/schema.sql`
5. Create public storage buckets in Supabase:
   - `storefront-images`
   - `product-images`
   - `qr-codes`
6. Start API:
   - `npm run dev`

Health check:
- `GET http://localhost:3000/health`

## 2) Free-Tier Notes

- AI runs on `gemini-2.0-flash` by default (free-tier friendly).
- Monthly AI usage limit is enforced with DB counts using `FREE_TIER_AI_LIMIT` (default `5`).
- Product limit per storefront is set to 10 for free tier.
- Supabase free project + public storage buckets keep infra cost low for MVP.

## 3) Base URL + Auth

- Base API URL: `http://localhost:3000/api/v1`
- Protected routes require:
  - `Authorization: Bearer <supabase_access_token>`

Public URL formats:
- Storefront: `kashmirconnect.in/s/:slug`
- Badge verify: `kashmirconnect.in/verify/:badge_code`

## 4) API Endpoints

### Auth (`/auth`)

- `POST /register`
- `POST /login`
- `POST /logout` (auth)
- `GET /me` (auth)
- `PUT /profile` (auth)

### Storefronts (`/storefronts`)

- `POST /` (auth) create storefront
- `GET /my` (auth) get current user's storefront + products + badge
- `GET /public/:slug` public storefront page payload (also records view analytics)
- `PUT /:id` (auth + owner)
- `POST /:id/upload-image` (auth + owner, multipart `cover` or `logo`)
- `DELETE /:id` (auth + owner, soft delete)
- `GET /explore` query: `sector`, `district`, `search`, `page`, `limit`

### Products (`/products`)

- `POST /` (auth + storefront owner)
- `GET /storefront/:storefrontId` public
- `PUT /:id` (auth + owner)
- `POST /:id/upload-image` (auth + owner, multipart `image`)
- `DELETE /:id` (auth + owner)
- `PUT /reorder` (auth + owner)

### Advisor (`/advisor`)

- `POST /chat` (auth, SSE stream response)
- `GET /conversations` (auth)
- `GET /conversations/:id` (auth)
- `DELETE /conversations/:id` (auth)

### Badges (`/badges`)

- `POST /request` (auth)
- `GET /my` (auth)
- `GET /verify/:badge_code` public
- `POST /generate-qr/:badge_code` (auth + owner)
- `PUT /admin/verify/:badge_id` (admin key via `x-admin-key`)

### Analytics (`/analytics`)

- `POST /event` public
- `GET /my` (auth) summary metrics for user's storefront

## 5) Supabase Project Configuration

### Auth

- Enable Email/Password sign-in in Supabase Auth settings.
- Phone OTP can be enabled later if needed (backend supports token-based auth middleware).

### Storage Buckets

Create these buckets and set public read:
- `storefront-images`
- `product-images`
- `qr-codes`

### SQL

Run `supabase/schema.sql` once to create:
- Profiles
- Storefronts
- Products
- Badges
- Advisor conversations
- Analytics events
- RLS policies

## 6) Getting Gemini API Key

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Create API key.
3. Add key to `.env` as `GEMINI_API_KEY`.
4. Keep `GEMINI_MODEL=gemini-2.0-flash` for free-tier optimization.

## 7) Frontend Integration Notes

- Use `http://localhost:3000/api/v1` as backend base URL.
- Attach bearer token for protected endpoints.
- For advisor streaming endpoint (`POST /advisor/chat`), read Server-Sent Events chunks until `type=done`.
- Storefront public URL format:
  - `kashmirconnect.in/s/:slug`
- Badge verify URL format:
  - `kashmirconnect.in/verify/:badge_code`
