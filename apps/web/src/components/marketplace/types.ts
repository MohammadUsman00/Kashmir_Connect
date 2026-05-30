export type MarketplaceStorefront = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sector: string;
  verified: boolean;
  featured: boolean;
  coverUrl: string | null;
  logoUrl: string | null;
  whatsapp: string | null;
  createdAt: Date | string;
  avgRating?: number;
  productCount?: number;
  topProductImages?: string[];
};

export type MarketplaceProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  images: string[];
  storefrontId: string;
};
