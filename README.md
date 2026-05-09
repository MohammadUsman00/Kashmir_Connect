# KashmirConnect

KashmirConnect is a platform for Kashmir's small businesses (artisans, farmers, tourism operators, and food sellers) to build digital storefronts, track engagement, and get AI business guidance with a free-tier-first setup.

## Repository Structure

- `kashmirconnect-backend/` - Full Node.js + Express backend API
- `cursor-backend-prompt.md` - Original backend scaffolding prompt

## Backend Quick Start

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

Health endpoint:
- `GET http://localhost:3000/health`

## Free-Tier Focus

- AI uses Google Gemini (`gemini-2.0-flash`) free-tier friendly model.
- Monthly AI usage cap is enforced via DB with `FREE_TIER_AI_LIMIT` (default `5`).
- Product count is capped per storefront to keep the MVP free-tier practical.

## API Base URL

- `http://localhost:3000/api/v1`

For complete API docs and route details, see:
- `kashmirconnect-backend/README.md`
