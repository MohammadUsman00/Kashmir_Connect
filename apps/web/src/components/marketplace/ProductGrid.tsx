"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KCBadge, KCButton, KCCard } from "@kashmir/ui";
import type { MarketplaceProduct } from "./types";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

type QuickViewState = {
  product: MarketplaceProduct;
  related: MarketplaceProduct[];
  storefrontName: string;
  whatsapp: string | null;
};

function whatsappOrderLink(whatsapp: string | null, storefrontName: string, productName: string): string {
  if (!whatsapp) return "#";
  const phone = whatsapp.replace(/[^\d+]/g, "").replace("+", "");
  const msg = encodeURIComponent(`Hi ${storefrontName}, I want to order "${productName}".`);
  return `https://wa.me/${phone}?text=${msg}`;
}

export function ProductGrid({
  products,
  storefrontName,
  whatsapp
}: {
  products: MarketplaceProduct[];
  storefrontName: string;
  whatsapp: string | null;
}): JSX.Element {
  const [quickView, setQuickView] = React.useState<QuickViewState | null>(null);
  const [activeImage, setActiveImage] = React.useState(0);

  const openQuickView = (product: MarketplaceProduct) => {
    const related = products.filter((item) => item.id !== product.id).slice(0, 4);
    setQuickView({ product, related, storefrontName, whatsapp });
    setActiveImage(0);
  };

  return (
    <>
      <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
        {products.map((product) => (
          <div key={product.id} className="mb-4 break-inside-avoid">
            <motion.div whileHover={{ y: -2 }}>
              <KCCard className="overflow-hidden p-0">
                <div
                  className="group relative h-52 cursor-pointer overflow-hidden bg-[#f4e7d4]"
                  onClick={() => openQuickView(product)}
                >
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-[#775f4e]">No image</div>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">{product.name}</p>
                  <p className="text-xs text-[#6a5547] dark:text-[#bdcee4]">{formatPrice(product.price)}</p>
                  <div className="flex items-center justify-between">
                    <KCBadge variant={product.stock && product.stock < 5 ? "pending" : "sector"}>
                      {product.stock == null ? "Stock unknown" : product.stock < 5 ? "Low stock" : "In stock"}
                    </KCBadge>
                    <KCButton size="sm" variant="ghost" onClick={() => openQuickView(product)}>
                      Quick View
                    </KCButton>
                  </div>
                </div>
              </KCCard>
            </motion.div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {quickView ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45 p-4 backdrop-blur-sm"
            onClick={() => setQuickView(null)}
          >
            <motion.div
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 24, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="mx-auto mt-8 max-w-3xl rounded-2xl bg-white p-4 shadow-2xl dark:bg-[#0f1a2b]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-2">
                  <div className="h-64 overflow-hidden rounded-xl bg-[#f4e7d4]">
                    {quickView.product.images[activeImage] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={quickView.product.images[activeImage]} alt={quickView.product.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {quickView.product.images.slice(0, 4).map((image, index) => (
                      <button
                        key={`${quickView.product.id}-thumb-${index}`}
                        className={`h-14 overflow-hidden rounded-lg border ${activeImage === index ? "border-[#C8972A]" : "border-[#dcccb6]"}`}
                        onClick={() => setActiveImage(index)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="thumb" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-[#3D1F0D] dark:text-[#f0ddb7]">{quickView.product.name}</h3>
                  <p className="text-sm text-[#6a5547] dark:text-[#bdcee4]">{quickView.product.description ?? "No description available."}</p>
                  <p className="text-lg font-semibold">{formatPrice(quickView.product.price)}</p>
                  <KCBadge variant={quickView.product.stock && quickView.product.stock < 5 ? "pending" : "verified"}>
                    {quickView.product.stock == null ? "Stock unknown" : `${quickView.product.stock} units available`}
                  </KCBadge>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={whatsappOrderLink(quickView.whatsapp, quickView.storefrontName, quickView.product.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <KCButton size="sm">Order via WhatsApp</KCButton>
                    </a>
                    <KCButton size="sm" variant="secondary">
                      Add to Inquiry
                    </KCButton>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Related products</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickView.related.map((related) => (
                        <button
                          key={related.id}
                          className="rounded-lg border border-[#dfd0ba] p-2 text-left text-xs dark:border-[#2b405b]"
                          onClick={() => openQuickView(related)}
                        >
                          <p className="line-clamp-1 font-semibold">{related.name}</p>
                          <p>{formatPrice(related.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
