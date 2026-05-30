import { prisma } from "@kashmir/db";
import { FilterPanel } from "@/components/marketplace/FilterPanel";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { ExploreFeed } from "@/components/marketplace/ExploreFeed";
import type { MarketplaceStorefront } from "@/components/marketplace/types";
import { getTrendingSearches } from "@/lib/search/typesense";

type SearchParams = {
  sector?: string;
  verified?: string;
  district?: string;
  sort?: "featured" | "newest" | "rating";
  search?: string;
};

function toBool(value: string | undefined): boolean | undefined {
  if (value == null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}): Promise<JSX.Element> {
  const params = await searchParams;
  const sort = params.sort ?? "featured";
  const verified = toBool(params.verified);

  const items = await prisma.storefront.findMany({
    where: {
      published: true,
      sector: params.sector,
      verified,
      ...(params.search?.trim()
        ? {
            OR: [
              { name: { contains: params.search.trim(), mode: "insensitive" } },
              { description: { contains: params.search.trim(), mode: "insensitive" } },
              {
                products: {
                  some: {
                    name: { contains: params.search.trim(), mode: "insensitive" }
                  }
                }
              }
            ]
          }
        : {}),
      ...(params.district?.trim()
        ? { description: { contains: params.district.trim(), mode: "insensitive" } }
        : {})
    },
    include: {
      products: {
        where: { hidden: false },
        orderBy: { order: "asc" },
        take: 3,
        select: { images: true }
      },
      _count: { select: { products: true, reviews: true } },
      reviews: {
        where: { approved: true },
        select: { rating: true }
      }
    },
    orderBy:
      sort === "newest"
        ? [{ createdAt: "desc" }]
        : sort === "rating"
          ? [{ verified: "desc" }, { featured: "desc" }, { createdAt: "desc" }]
          : [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
    take: 12
  });

  const trendingSearches = await getTrendingSearches(8);

  const mapped = items.map((storefront) => {
    const ratings = storefront.reviews.map((review) => review.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const topProductImages = storefront.products.flatMap((product) => (product.images as string[]) ?? []).slice(0, 3);
    return {
      ...storefront,
      productCount: storefront._count.products,
      avgRating,
      topProductImages
    };
  }) as MarketplaceStorefront[];

  const initialCursor = mapped.length === 12 ? mapped[mapped.length - 1]?.id ?? null : null;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-[#3D1F0D] dark:text-[#f3dfbb]">Explore Kashmir Marketplace</h1>
        <p className="text-sm text-[#6c574a] dark:text-[#b8cade]">
          Discover verified local businesses across Handicrafts, Dry Fruits, Tourism, Agriculture, Textiles,
          Copperware, Carpets, and Spices.
        </p>
      </div>

      <SearchBar trendingSearches={trendingSearches} />

      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <FilterPanel />
        <ExploreFeed
          initialItems={mapped}
          initialCursor={initialCursor}
          filters={{
            sector: params.sector,
            verified,
            district: params.district,
            search: params.search,
            sort
          }}
        />
      </section>
    </main>
  );
}
