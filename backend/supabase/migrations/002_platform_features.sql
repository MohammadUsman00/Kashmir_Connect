-- Run after schema.sql (safe to re-run with IF NOT EXISTS)

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
