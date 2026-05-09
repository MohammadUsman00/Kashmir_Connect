# KashmirConnect

KashmirConnect is a full-stack platform for Kashmir's small businesses (artisans, farmers, tourism operators, and food sellers) to build digital storefronts, request authenticity badges, track analytics, and get AI business guidance using a free-tier-first architecture.

## Current Project Status

- Backend is fully scaffolded in `kashmirconnect-backend/` with modular routes/controllers.
- Frontend is fully modularized in `frontend/` (Vite + vanilla JS).
- AI provider is Google Gemini (Claude removed).
- Free-tier limits are implemented (AI monthly cap + product cap).
- Project is ready for local development and deployment.

## Repository Structure

- `frontend/` - Modular frontend app (Vite + vanilla JS)
- `kashmirconnect-backend/` - Full Node.js + Express backend API
- `cursor-backend-prompt.md` - Original backend scaffolding prompt

## Full Local Setup (Frontend + Backend)

### 1) Backend Setup

1. Open the backend folder:
   - `cd kashmirconnect-backend`
2. Install dependencies:
   - `npm install`
3. Create environment file:
   - copy `.env.example` to `.env`
4. Configure required keys in `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
5. Run SQL schema in Supabase:
   - `supabase/schema.sql`
6. Create storage buckets in Supabase:
   - `storefront-images` (public)
   - `product-images` (public)
   - `qr-codes` (public)
7. Start server:
   - `npm run dev`

Backend health endpoint:
- `GET http://localhost:3000/health`

### 2) Frontend Setup

1. Open frontend folder:
   - `cd frontend`
2. Install dependencies:
   - `npm install`
3. Create env:
   - copy `.env.example` to `.env`
4. Set API URL:
   - `VITE_API_BASE_URL=http://localhost:3000/api/v1`
5. Run:
   - `npm run dev`

## Free-Tier-First Design

- AI uses Google Gemini (`gemini-2.0-flash`) free-tier friendly model.
- Monthly AI usage cap is enforced via DB with `FREE_TIER_AI_LIMIT` (default `5`).
- Product count is capped per storefront to keep usage free-tier practical.
- Uses Supabase free-tier friendly setup for DB/Auth/Storage.

## Architecture Snapshot

- Frontend:
  - Config: `src/config`
  - API layer: `src/services`
  - Shared HTTP client: `src/lib`
  - Session state: `src/state`
  - UI/view modules: `src/views`, `src/ui`, `src/styles`
- Backend:
  - Config: `src/config`
  - Middleware: `src/middleware`
  - Routes: `src/routes`
  - Controllers: `src/controllers`
  - Utilities: `src/utils`

## Deployment Checklist

### Backend deploy

- Set backend env variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL=gemini-2.0-flash`
  - `FREE_TIER_AI_LIMIT=5`
  - `APP_URL=<frontend-domain>`
- For multiple frontend domains, use comma-separated origins:
  - `APP_URL=https://yourapp.vercel.app,https://kashmirconnect.in`

### Frontend deploy

- Build frontend:
  - `cd frontend`
  - `npm run build`
- Deploy `frontend/dist/` to static hosting (Vercel/Netlify/Cloudflare Pages/etc).
- Set frontend env variable:
  - `VITE_API_BASE_URL=https://your-backend-domain/api/v1`

## API Base URL (Local)

- Backend API: `http://localhost:3000/api/v1`

For complete API docs and route details, see:
- `kashmirconnect-backend/README.md`

Frontend deployment guide:
- `frontend/README.md`
