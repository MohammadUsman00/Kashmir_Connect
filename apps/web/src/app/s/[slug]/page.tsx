import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@kashmir/db";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import type { MarketplaceProduct } from "@/components/marketplace/types";
import { StorefrontShareKit } from "@/components/marketplace/StorefrontShareKit";
import { OrderRequestForm } from "@/components/marketplace/OrderRequestForm";

export const revalidate = 60;

type Params = { slug: string };

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kashmirconnect.in";

async function getStorefront(slug: string) {
  return prisma.storefront.findUnique({
    where: { slug },
    include: {
      products: {
        where: { hidden: false },
        orderBy: { order: "asc" }
      },
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 40
      }
    }
  });
}

export async function generateStaticParams(): Promise<Params[]> {
  const storefronts = await prisma.storefront.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
    take: 1000,
    select: { slug: true }
  });
  return storefronts.map((storefront) => ({ slug: storefront.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const storefront = await getStorefront(slug);
  if (!storefront) {
    return { title: "Storefront not found - Kashmir Connect" };
  }

  const ratings = storefront.reviews.map((review) => review.rating);
  const avgRating = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  const title = `${storefront.name} | ${storefront.sector} in Kashmir`;
  const description =
    storefront.description?.slice(0, 160) ||
    `${storefront.name} offers authentic ${storefront.sector} products on Kashmir Connect.`;
  const image = storefront.coverUrl || storefront.logoUrl || `${SITE_URL}/og-default.png`;
  const canonical = `${SITE_URL}/s/${storefront.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      url: canonical,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    },
    other: {
      "x-storefront-rating": avgRating.toFixed(1)
    }
  };
}

function starDistribution(ratings: number[]): Array<{ star: number; count: number; pct: number }> {
  const total = ratings.length || 1;
  return [5, 4, 3, 2, 1].map((star) => {
    const count = ratings.filter((rating) => Math.round(rating) === star).length;
    return {
      star,
      count,
      pct: Math.round((count / total) * 100)
    };
  });
}

export default async function StorefrontPage({
  params
}: {
  params: Promise<Params>;
}): Promise<JSX.Element> {
  const { slug } = await params;
  const storefront = await getStorefront(slug);
  if (!storefront || !storefront.published) return notFound();

  const ratings = storefront.reviews.map((review) => review.rating);
  const avgRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  const distribution = starDistribution(ratings);

  const products: MarketplaceProduct[] = storefront.products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    stock: product.stock ?? null,
    images: (product.images as string[]) ?? [],
    storefrontId: product.storefrontId
  }));

  const canonicalUrl = `${SITE_URL}/s/${storefront.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: storefront.name,
    image: storefront.coverUrl || storefront.logoUrl || undefined,
    telephone: storefront.whatsapp || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kashmir"
    },
    aggregateRating:
      ratings.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount: ratings.length
          }
        : undefined
  };

  return (
    <main className="min-h-screen bg-[var(--background)] pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative h-[46vh] min-h-[320px] overflow-hidden">
        {storefront.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storefront.coverUrl}
            alt={`${storefront.name} cover`}
            className="h-full w-full object-cover"
            style={{ transform: "translateZ(0)" }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-[#3D1F0D] via-[#1B6CA8] to-[#C8972A]" />
        )}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl p-4 md:p-6">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/40 bg-white/30 backdrop-blur-sm">
              {storefront.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storefront.logoUrl} alt={`${storefront.name} logo`} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xl font-semibold text-white">
                  {storefront.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">{storefront.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {storefront.verified ? <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-white">Verified</span> : null}
                <span className="rounded-full bg-[#C8972A]/90 px-3 py-1 text-[#241406]">{storefront.sector}</span>
                <span className="rounded-full bg-white/85 px-3 py-1 text-[#3D1F0D]">Canonical: {canonicalUrl}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="grid gap-3 rounded-2xl border border-[#e4d5bf] bg-white/85 p-4 dark:border-[#243851] dark:bg-[#0f1b2d]/85 md:grid-cols-4">
          <div>
            <p className="text-xs text-[#6b5648] dark:text-[#b8cbe0]">Products</p>
            <p className="text-lg font-semibold">{products.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#6b5648] dark:text-[#b8cbe0]">Reviews</p>
            <p className="text-lg font-semibold">{storefront.reviews.length}</p>
          </div>
          <div>
            <p className="text-xs text-[#6b5648] dark:text-[#b8cbe0]">Member since</p>
            <p className="text-lg font-semibold">{new Date(storefront.createdAt).getFullYear()}</p>
          </div>
          <div>
            <p className="text-xs text-[#6b5648] dark:text-[#b8cbe0]">WhatsApp response</p>
            <p className="text-lg font-semibold">{storefront.whatsapp ? "~10 mins" : "N/A"}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 p-4 md:p-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <ProductGrid products={products} storefrontName={storefront.name} whatsapp={storefront.whatsapp} />

          <div className="space-y-4 rounded-2xl border border-[#e4d5bf] bg-white/90 p-4 dark:border-[#243851] dark:bg-[#0f1b2d]/90">
            <h2 className="text-xl font-semibold">Reviews</h2>
            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-2">
                <p className="text-3xl font-semibold">★ {avgRating.toFixed(1)}</p>
                {distribution.map((item) => (
                  <div key={`star-${item.star}`} className="flex items-center gap-2 text-xs">
                    <span className="w-10">{item.star}★</span>
                    <div className="h-2 flex-1 rounded-full bg-[#ecdcc4] dark:bg-[#1f344e]">
                      <div className="h-full rounded-full bg-[#C8972A]" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span>{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {storefront.reviews.slice(0, 6).map((review) => (
                  <div key={review.id} className="rounded-xl border border-[#e7d9c4] bg-[#fdf8f1] p-3 dark:border-[#2a405d] dark:bg-[#13253d]">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-[#3D1F0D] text-xs text-white">
                        {review.authorName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{review.authorName}</p>
                        <p className="text-xs text-[#705c4f] dark:text-[#a9bfd9]">{"★".repeat(Math.round(review.rating))}</p>
                      </div>
                    </div>
                    {review.body ? <p className="mt-2 text-sm text-[#614d40] dark:text-[#c0d1e7]">{review.body}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <StorefrontShareKit storefrontName={storefront.name} url={canonicalUrl} />
          <OrderRequestForm storefrontName={storefront.name} storefrontId={storefront.id} whatsapp={storefront.whatsapp} />
        </div>
      </section>
    </main>
  );
}
