# KashmirConnect

KashmirConnect is a future-focused digital commerce platform for Kashmir's small businesses. It helps artisans, farmers, tourism operators, and local brands build a credible online presence, prove authenticity, understand customer behavior, and make better business decisions with AI.

## Vision

The core objective is business resilience and long-term growth:

- **Direct market access** to reduce middleman dependency
- **Trust infrastructure** through verifiable badge and QR workflows
- **Operational intelligence** with actionable analytics
- **Decision support** via localized AI business guidance
- **Scalable architecture** that can evolve from MVP to production-grade multi-tenant platform

## Current Product Scope

KashmirConnect currently delivers:

- Storefront creation and management (publish/unpublish, share QR, WhatsApp share)
- Product catalog management (edit, reorder, hide/show on public page)
- Authenticity badge request, verification page, and admin approval workflow
- Analytics with charts, insights, and CSV export
- AI advisor chat with conversation history, suggested prompts, and Urdu/English support
- Public marketplace (`/explore`), storefront pages (`/s/:slug`), and badge verify (`/verify/:code`)
- SEO/Open Graph meta on public pages, category filters, and product inquiry via WhatsApp
- Dashboard onboarding wizard, dark mode, and admin panel for badge review

## Tech Stack

- **Frontend:** Vite + modular vanilla JavaScript architecture
- **Backend:** Node.js + Express API (`backend/`)
- **Database/Auth/Storage:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** Google Gemini (`gemini-2.0-flash`)
- **Validation and tooling:** Zod, QRCode, Multer, dotenv

## Repository Structure

- `frontend/` - Public landing page + modular dashboard app
- `backend/` - API, business logic, schema, and integrations

## Architecture (Future-Proof by Design)

### Frontend

- `src/config` - environment and runtime configuration
- `src/lib` - reusable API client and shared helpers
- `src/state` - session and local app state
- `src/services` - domain-based API service layer
- `src/views` + `src/ui` - composable UI and page rendering modules

### Backend

- `src/config` - provider clients and environment wiring
- `src/middleware` - auth, validation, centralized error handling
- `src/routes` - API surface contracts
- `src/controllers` - business workflows
- `src/utils` - shared domain helpers
- `supabase/schema.sql` - source-of-truth data model and RLS policies

This structure is intentionally modular to support:

- easier onboarding of new contributors
- incremental feature delivery
- cleaner testability and refactoring
- future migration to microservices if scale requires it

## Local Development Setup

### Backend

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Configure:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-2.0-flash`
   - `ALLOWED_ORIGINS=http://localhost:5173`
   - `PUBLIC_APP_URL=http://localhost:5173`
5. Run `supabase/schema.sql` in Supabase SQL editor
6. Create public storage buckets:
   - `storefront-images`
   - `product-images`
   - `qr-codes`
7. Start backend: `npm run dev`

Health check:
- `GET http://localhost:3000/health`

### Frontend

1. `cd frontend`
2. `npm install`
3. Copy `.env.example` to `.env`
4. Set `VITE_API_BASE_URL=http://localhost:3000/api/v1`
5. Start frontend: `npm run dev`

## Deployment Readiness Checklist

### Backend

- Set production env vars:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
  - `FREE_TIER_AI_LIMIT`
  - `ALLOWED_ORIGINS`
  - `PUBLIC_APP_URL`
- If multiple frontend origins are needed:
  - `ALLOWED_ORIGINS=https://yourapp.vercel.app,https://kashmirconnect.in`

### Frontend

- Build with `npm run build`
- Deploy `frontend/dist/` to static hosting
- Set `VITE_API_BASE_URL=https://your-backend-domain/api/v1`

## Cost and Sustainability Model

The project is optimized for low-cost operation while staying extensible:

- Gemini free-tier compatible model by default
- Supabase free-tier compatible MVP setup
- AI and product usage guardrails to control resource consumption
- Modular codebase ready for paid-tier transitions without rewrite

## Documentation

- Backend implementation and API details: `backend/README.md`
- Frontend pages, structure, and build notes: `frontend/README.md`
