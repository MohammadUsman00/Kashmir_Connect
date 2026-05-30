"use client";

import * as React from "react";
import { StorefrontCard } from "./StorefrontCard";
import type { MarketplaceStorefront } from "./types";
import { trpcClient } from "@/lib/trpc-client";

type FeedFilters = {
  sector?: string;
  verified?: boolean;
  district?: string;
  search?: string;
  sort: "featured" | "newest" | "rating";
};

export function ExploreFeed({
  initialItems,
  initialCursor,
  filters
}: {
  initialItems: MarketplaceStorefront[];
  initialCursor: string | null;
  filters: FeedFilters;
}): JSX.Element {
  const [items, setItems] = React.useState(initialItems);
  const [cursor, setCursor] = React.useState<string | null>(initialCursor);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(!initialCursor);
  const triggerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
    setDone(!initialCursor);
  }, [initialCursor, initialItems]);

  const loadMore = React.useCallback(async () => {
    if (loading || done || !cursor) return;
    setLoading(true);
    try {
      const response = await trpcClient.storefront.listCursor.query({
        ...filters,
        cursor,
        limit: 12
      });
      const mapped = response.items.map((item) => ({
        ...item,
        topProductImages: item.products.flatMap((product) => (product.images as string[]) ?? []).slice(0, 3),
        productCount: item._count.products
      })) as MarketplaceStorefront[];
      setItems((prev) => [...prev, ...mapped]);
      setCursor(response.nextCursor);
      if (!response.nextCursor) setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [cursor, done, filters, loading]);

  React.useEffect(() => {
    const node = triggerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((storefront) => (
          <StorefrontCard key={storefront.id} storefront={storefront} />
        ))}
      </div>
      <div ref={triggerRef} className="h-10" />
      {loading ? <p className="text-center text-sm text-[#6c584b] dark:text-[#b7c9df]">Loading more storefronts...</p> : null}
      {done ? <p className="text-center text-xs text-[#8b786a] dark:text-[#96aac4]">You reached the end.</p> : null}
    </div>
  );
}
