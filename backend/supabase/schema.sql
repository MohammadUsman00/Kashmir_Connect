CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE public.advisor_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  storefront_id UUID REFERENCES public.storefronts(id),
  messages JSONB DEFAULT '[]'::jsonb,
  query_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.advisor_usage_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.advisor_conversations(id) ON DELETE CASCADE,
  storefront_id UUID REFERENCES public.storefronts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('chat_query')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners view own analytics events" ON public.analytics_events FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.storefronts WHERE id = storefront_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_usage_events ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users view own advisor usage events" ON public.advisor_usage_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own advisor usage events" ON public.advisor_usage_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Platform features (leads, orders, reviews, notifications, galleries, featured storefronts)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ur'));

ALTER TABLE public.storefronts
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_count INTEGER;

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  storefront_id UUID REFERENCES public.storefronts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'inquiry',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  storefront_id UUID REFERENCES public.storefronts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  storefront_id UUID REFERENCES public.storefronts(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own leads" ON public.leads FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.storefronts WHERE id = storefront_id)
);
CREATE POLICY "Owners update own leads" ON public.leads FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.storefronts WHERE id = storefront_id)
);

CREATE POLICY "Owners view own orders" ON public.orders FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.storefronts WHERE id = storefront_id)
);
CREATE POLICY "Owners update own orders" ON public.orders FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.storefronts WHERE id = storefront_id)
);

CREATE POLICY "Public view approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Owners manage storefront reviews" ON public.reviews FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.storefronts WHERE id = storefront_id)
);

CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Owners manage product images" ON public.product_images FOR ALL USING (
  auth.uid() = (
    SELECT s.user_id FROM public.storefronts s
    JOIN public.products p ON p.storefront_id = s.id
    WHERE p.id = product_id
  )
);

CREATE INDEX IF NOT EXISTS idx_leads_storefront ON public.leads(storefront_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_storefront ON public.orders(storefront_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_storefront ON public.reviews(storefront_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
