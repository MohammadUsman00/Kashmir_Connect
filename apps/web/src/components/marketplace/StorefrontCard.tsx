"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { KCBadge, KCButton, KCCard } from "@kashmir/ui";
import type { MarketplaceStorefront } from "./types";

function toWhatsappLink(whatsapp: string | null, storefrontName: string): string {
  if (!whatsapp) return "#";
  const phone = whatsapp.replace(/[^\d+]/g, "");
  const text = encodeURIComponent(`Hi ${storefrontName}, I found you on Kashmir Connect.`);
  return `https://wa.me/${phone.replace("+", "")}?text=${text}`;
}

export function StorefrontCard({ storefront }: { storefront: MarketplaceStorefront }): JSX.Element {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <KCCard className="h-full overflow-hidden p-0">
        <div className="relative h-36 overflow-hidden">
          {storefront.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={storefront.coverUrl} alt={storefront.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-[#3D1F0D] via-[#1B6CA8] to-[#C8972A]" />
          )}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {storefront.verified ? <KCBadge variant="verified">Verified</KCBadge> : null}
            {storefront.featured ? <KCBadge variant="featured">Featured</KCBadge> : null}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#e4d5c0]">
              {storefront.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storefront.logoUrl} alt={`${storefront.name} logo`} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[#f3e8d7] text-sm font-semibold text-[#3D1F0D]">
                  {storefront.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <Link href={`/s/${storefront.slug}`} className="line-clamp-1 text-base font-semibold text-[#3D1F0D] dark:text-[#f0ddb7]">
                {storefront.name}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#6d584b] dark:text-[#c0d0e3]">
                <KCBadge variant="sector">{storefront.sector}</KCBadge>
                <span>★ {(storefront.avgRating ?? 0).toFixed(1)}</span>
                <span>{storefront.productCount ?? 0} products</span>
              </div>
            </div>
          </div>

          <p className="line-clamp-2 text-sm text-[#634f42] dark:text-[#c3d2e7]">{storefront.description ?? "Discover handcrafted Kashmir products."}</p>

          <div className="grid grid-cols-3 gap-2">
            {(storefront.topProductImages ?? []).slice(0, 3).map((image, index) => (
              <div key={`${storefront.id}-img-${index}`} className="h-14 overflow-hidden rounded-lg bg-[#f3e7d6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Product preview" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/s/${storefront.slug}`} className="flex-1">
              <KCButton className="w-full" size="sm">
                Visit Storefront
              </KCButton>
            </Link>
            <a href={toWhatsappLink(storefront.whatsapp, storefront.name)} target="_blank" rel="noopener noreferrer" className="flex-1">
              <KCButton variant="secondary" size="sm" className="w-full">
                WhatsApp
              </KCButton>
            </a>
          </div>
        </div>
      </KCCard>
    </motion.div>
  );
}
