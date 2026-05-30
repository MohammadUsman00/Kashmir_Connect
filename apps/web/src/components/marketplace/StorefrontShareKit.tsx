"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KCButton, KCCard } from "@kashmir/ui";

export function StorefrontShareKit({
  storefrontName,
  url
}: {
  storefrontName: string;
  url: string;
}): JSX.Element {
  const [openQr, setOpenQr] = React.useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;

  return (
    <>
      <KCCard className="space-y-3">
        <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Share this storefront</h3>
        <div className="flex flex-wrap gap-2">
          <KCButton
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
            }}
          >
            Copy link
          </KCButton>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Check out ${storefrontName} on Kashmir Connect: ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <KCButton size="sm" variant="secondary">
              WhatsApp share
            </KCButton>
          </a>
          <KCButton size="sm" variant="ghost" onClick={() => setOpenQr(true)}>
            QR code
          </KCButton>
        </div>
      </KCCard>

      <AnimatePresence>
        {openQr ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 p-4"
            onClick={() => setOpenQr(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.97 }}
              className="mx-auto mt-16 max-w-sm rounded-2xl bg-white p-4 dark:bg-[#0f1a2b]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="mb-3 text-center text-sm font-semibold">Scan to open {storefrontName}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="Storefront QR code" className="mx-auto h-60 w-60 rounded-lg" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
