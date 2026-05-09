# KashmirConnect — Complete Backend Cursor Prompt

Paste this entire prompt into Cursor's AI chat and it will scaffold the full working backend.

---

## CURSOR PROMPT (copy everything below this line)

---

Build me a complete, production-ready Node.js + Express backend for **KashmirConnect** — a platform for Kashmir's small businesses (artisans, saffron farmers, tourism operators) to create digital storefronts, get AI business advice, and receive authenticity badges with QR codes.

---

## TECH STACK

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL) using `@supabase/supabase-js`
- **Authentication**: Supabase Auth (phone OTP + email/password)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`) — model: `claude-opus-4-5`
- **QR Generation**: `qrcode` npm package
- **File Uploads**: Supabase Storage
- **Email**: Resend (`resend` npm package)
- **Validation**: `zod`
- **Environment**: `dotenv`
- **CORS**: `cors`

---

## PROJECT STRUCTURE

Create this exact folder structure:

```
kashmirconnect-backend/
├── src/
│   ├── index.js               # Entry point
│   ├── config/
│   │   ├── supabase.js        # Supabase client
│   │   └── anthropic.js       # Anthropic client
│   ├── middleware/
│   │   ├── auth.js            # JWT verification middleware
│   │   ├── validate.js        # Zod validation middleware
│   │   └── errorHandler.js    # Global error handler
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── storefront.js      # Storefront CRUD routes
│   │   ├── products.js        # Product management routes
│   │   ├── advisor.js         # AI advisor routes
│   │   ├── badge.js           # Authenticity badge & QR routes
│   │   └── analytics.js       # View & click analytics routes
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── storefrontController.js
│   │   ├── productsController.js
│   │   ├── advisorController.js
│   │   ├── badgeController.js
│   │   └── analyticsController.js
│   └── utils/
│       ├── qrGenerator.js     # QR code generation helper
│       ├── slugGenerator.js   # Unique slug generator
│       └── systemPrompt.js    # Claude system prompt builder
├── supabase/
│   └── schema.sql             # Full DB schema
├── .env.example
├── package.json
└── README.md
```

---

## DATABASE SCHEMA (supabase/schema.sql)

Create this full schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  sector TEXT CHECK (sector IN ('handicrafts', 'agriculture', 'tourism', 'food', 'other')),
  district TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STOREFRONTS
CREATE TABLE public.storefronts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  sector TEXT NOT NULL,
  district TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  instagram TEXT,
  cover_image_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  storefront_id UUID REFERENCES public.storefronts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  price_unit TEXT DEFAULT 'piece',
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTHENTICITY BADGES
CREATE TABLE public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  storefront_id UUID REFERENCES public.storefronts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  badge_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  qr_code_url TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI ADVISOR CONVERSATIONS
CREATE TABLE public.advisor_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  storefront_id UUID REFERENCES public.storefronts(id),
  messages JSONB DEFAULT '[]'::jsonb,
  query_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANALYTICS (storefront views & product clicks)
CREATE TABLE public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  storefront_id UUID REFERENCES public.storefronts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'whatsapp_click', 'product_view', 'badge_scan')),
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_conversations ENABLE ROW LEVEL SECURITY;

-- Policies: users can only modify their own data
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own storefronts" ON public.storefronts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view active storefronts" ON public.storefronts FOR SELECT USING (is_active = true);
CREATE POLICY "Users manage own products" ON public.products FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.storefronts WHERE id = storefront_id)
);
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (is_available = true);
CREATE POLICY "Users manage own badges" ON public.badges FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.storefronts WHERE id = storefront_id)
);
CREATE POLICY "Public can view verified badges" ON public.badges FOR SELECT USING (status = 'verified');
CREATE POLICY "Users manage own conversations" ON public.advisor_conversations FOR ALL USING (auth.uid() = user_id);
```

---

## .env.example

```env
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Resend (email)
RESEND_API_KEY=your_resend_api_key

# App
APP_URL=http://localhost:5173
BASE_URL=http://localhost:3000
FREE_TIER_AI_LIMIT=5
```

---

## FULL IMPLEMENTATION REQUIREMENTS

### src/index.js
- Express app with CORS (allow frontend origin from env)
- JSON body parser
- Mount all routes under `/api/v1/`
- Health check: `GET /health` returns `{ status: 'ok', timestamp }`
- Global error handler middleware at the end
- Listen on `PORT` from env

### src/config/supabase.js
- Export two clients: `supabase` (anon key, for user-facing queries) and `supabaseAdmin` (service role key, for admin ops like badge verification)

### src/config/anthropic.js
- Export initialized Anthropic client

### src/middleware/auth.js
- Extract Bearer token from Authorization header
- Verify with `supabase.auth.getUser(token)`
- Attach `req.user` (user object) and `req.userId`
- Return 401 if token missing or invalid

### src/middleware/validate.js
- Factory function: `validate(schema)` returns Express middleware
- Uses `schema.safeParse(req.body)` and returns 400 with Zod errors if invalid

### src/middleware/errorHandler.js
- Catches all errors
- Logs error in development
- Returns `{ error: message, ...(dev ? { stack } : {}) }`
- Handles Supabase errors, Anthropic errors, and generic errors

---

### AUTH ROUTES (`/api/v1/auth`)

**POST /register**
- Body: `{ email, password, full_name, phone, business_name, sector, district }`
- Creates Supabase auth user
- Creates profile row in `public.profiles`
- Returns `{ user, session, profile }`

**POST /login**
- Body: `{ email, password }`
- Returns `{ user, session, profile }`

**POST /logout**
- Auth required
- Calls `supabase.auth.signOut()`

**GET /me**
- Auth required
- Returns full profile with storefront summary

**PUT /profile**
- Auth required
- Body: any profile fields to update
- Updates `public.profiles`

---

### STOREFRONT ROUTES (`/api/v1/storefronts`)

**POST /** (auth required)
- Body: `{ business_name, tagline, description, sector, district, phone, whatsapp, email, instagram }`
- Auto-generate unique `slug` from business_name (use slugify + random suffix if taken)
- Create storefront row
- Returns full storefront object with `public_url: \`kashmirconnect.in/s/\${slug}\``

**GET /my** (auth required)
- Returns current user's storefront with all products and badge status

**GET /public/:slug** (public)
- Returns storefront + products + badge (if verified)
- Increments `view_count` by 1
- Records analytics event `view`

**PUT /:id** (auth required, must own storefront)
- Updates storefront fields
- Handle image uploads via Supabase Storage

**POST /:id/upload-image** (auth required)
- Accepts multipart form with `cover` or `logo` field
- Upload to Supabase Storage bucket `storefront-images`
- Update storefront with new URL
- Return `{ url }`

**DELETE /:id** (auth required, must own)
- Soft delete: set `is_active = false`

**GET /explore** (public)
- Query params: `sector`, `district`, `search`, `page`, `limit`
- Returns paginated list of active, verified storefronts
- Full-text search on business_name and description

---

### PRODUCTS ROUTES (`/api/v1/products`)

**POST /** (auth required)
- Body: `{ storefront_id, name, description, price, price_unit, category }`
- Validate user owns the storefront
- Free tier: max 10 products (check count)
- Create product

**GET /storefront/:storefrontId** (public)
- Returns all available products for a storefront

**PUT /:id** (auth required, must own)
- Updates product fields

**POST /:id/upload-image** (auth required)
- Upload product image to `product-images` Supabase Storage bucket

**DELETE /:id** (auth required, must own)
- Deletes product

**PUT /reorder** (auth required)
- Body: `{ products: [{ id, sort_order }] }`
- Bulk update sort_order

---

### AI ADVISOR ROUTES (`/api/v1/advisor`)

**POST /chat** (auth required)
- Body: `{ message, storefront_id?, conversation_id? }`
- FREE TIER CHECK: count monthly queries from `advisor_conversations`. If >= FREE_TIER_AI_LIMIT (5), return 429 with upgrade message
- Load or create conversation
- Build context-aware system prompt (see system prompt below)
- Fetch user's storefront data and recent analytics to include as context
- Call Anthropic Claude API with full conversation history
- Stream response using `createStream` (handle streaming properly)
- Save updated conversation to DB
- Return `{ reply, conversation_id, queries_used, queries_limit }`

**GET /conversations** (auth required)
- Returns list of user's past conversations (summary only)

**GET /conversations/:id** (auth required)
- Returns full conversation with all messages

**DELETE /conversations/:id** (auth required)
- Deletes conversation

### AI System Prompt (src/utils/systemPrompt.js)

Build this system prompt dynamically:

```
You are KashmirConnect's AI Business Advisor — a knowledgeable, friendly expert specifically trained to help Kashmir's small businesses grow and thrive.

You deeply understand:
- Kashmir's economy: handicrafts (carpets, Pashmina, Papier-mâché, wood carving), saffron and agriculture (Pampore saffron, walnuts, apples, honey), tourism (Dal Lake houseboats, shikara, trekking, homestays), and food products
- Kashmir's business challenges: seasonal disruptions, middlemen dependency, connectivity issues, flood risks
- Government schemes available to J&K businesses: Vocal for Local, PM Vishwakarma Yojana, MSME schemes, GI Tag certification process
- Digital platforms for Kashmir sellers: Amazon (Saheli/Karigar), Meesho, Instagram Shopping, Etsy (for exports), JioMart
- Local context: business culture, pricing norms, off-season survival strategies

Business context for this user:
- Business: {{business_name}}
- Sector: {{sector}}
- District: {{district}}
- Products: {{product_list}}
- Storefront views this month: {{monthly_views}}

Rules:
1. Always give specific, actionable advice tailored to Kashmir
2. Mention specific platform names, scheme names, and concrete steps
3. Keep responses concise but complete (150-250 words max)
4. Use simple language (the user may not be highly tech-literate)
5. When relevant, mention KashmirConnect features that could help
6. Respond in the same language the user writes in (Urdu or English)
7. Never give generic business advice — always Kashmir-specific
```

---

### BADGE ROUTES (`/api/v1/badges`)

**POST /request** (auth required)
- Body: `{ storefront_id, business_type, years_in_business, address, description }`
- Check no existing badge request for this storefront
- Generate unique `badge_code` (format: `KC` + random 6 chars uppercase, e.g. `KCZA8F2`)
- Create badge with status `pending`
- Return `{ badge_id, badge_code, status: 'pending' }`

**GET /my** (auth required)
- Returns badge status for current user's storefront

**GET /verify/:badge_code** (PUBLIC — no auth needed)
- Used when someone scans the QR code
- Returns: `{ verified: true/false, business_name, sector, badge_code, verified_at, storefront_url }`
- Record analytics event `badge_scan`
- If not found or not verified: `{ verified: false, message: 'Badge not found' }`

**POST /generate-qr/:badge_code** (auth required, must own)
- Generate QR code PNG pointing to `{APP_URL}/verify/{badge_code}`
- Use `qrcode` package with options: `{ errorCorrectionLevel: 'H', width: 300, color: { dark: '#3D2314', light: '#FFFFFF' } }`
- Upload QR image to Supabase Storage bucket `qr-codes`
- Update badge with `qr_code_url`
- Return `{ qr_code_url }`

**PUT /admin/verify/:badge_id** (service role only — for admin panel)
- Updates badge status to `verified`
- Sets `verified_at`, `expires_at`
- Also sets storefront `is_verified = true`

---

### ANALYTICS ROUTES (`/api/v1/analytics`)

**POST /event** (public — called from frontend)
- Body: `{ storefront_id, event_type, product_id?, referrer? }`
- Hash the IP: `crypto.createHash('sha256').update(req.ip).digest('hex').slice(0,16)`
- Insert analytics event
- Return `{ recorded: true }`

**GET /my** (auth required)
- Returns analytics summary for user's storefront:
  ```json
  {
    "total_views": 342,
    "views_this_month": 89,
    "whatsapp_clicks": 23,
    "badge_scans": 12,
    "top_products": [...],
    "views_by_day": [...last 30 days...]
  }
  ```

---

## PACKAGE.JSON

```json
{
  "name": "kashmirconnect-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.36.0",
    "@supabase/supabase-js": "^2.45.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "qrcode": "^1.5.4",
    "resend": "^4.0.0",
    "slugify": "^1.6.6",
    "zod": "^3.23.8"
  }
}
```

---

## ADDITIONAL REQUIREMENTS

1. **All routes must have proper error handling** — wrap controllers in try/catch and call `next(error)`

2. **Ownership validation helper** — create `src/utils/checkOwnership.js`:
   - `checkStorefrontOwnership(storefrontId, userId)` — queries DB and throws 403 if not owner

3. **Rate limiting** on AI advisor: check monthly query count from DB (not Redis, to keep it simple)

4. **Streaming for AI responses**: Use Anthropic's streaming API properly. Send `Content-Type: text/event-stream` and stream chunks to the client. Handle the `message_stop` event to save the full response to DB.

5. **Supabase Storage buckets** to create (mention in README):
   - `storefront-images` (public read)
   - `product-images` (public read)
   - `qr-codes` (public read)

6. **README.md** must include:
   - Setup instructions (clone, npm install, .env setup, supabase schema, run)
   - All API endpoints documented
   - How to set up Supabase project and storage buckets
   - How to get Anthropic API key

7. **Frontend integration notes** in README:
   - Base URL: `http://localhost:3000/api/v1`
   - Auth: Bearer token in Authorization header
   - Public storefront URL format: `kashmirconnect.in/s/:slug`
   - Badge verification URL: `kashmirconnect.in/verify/:badge_code`

Generate all files completely — no placeholders, no `// TODO` comments. Every function fully implemented.
```

---

## END OF CURSOR PROMPT
