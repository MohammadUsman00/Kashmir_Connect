"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KCButton } from "./kc-button";
import { cn } from "./utils";

export interface KCNavItem {
  href: string;
  label: string;
}

export function KCNavbar({
  brand = "Kashmir Connect",
  items,
  rightSlot
}: {
  brand?: string;
  items: KCNavItem[];
  rightSlot?: React.ReactNode;
}): JSX.Element {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all",
        scrolled
          ? "border-b border-white/30 bg-white/60 backdrop-blur-md dark:border-[#22334c] dark:bg-[#0d1728]/80"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <a href="/" className="font-semibold tracking-tight text-[#3D1F0D] dark:text-[#f6e2c0]">
          {brand}
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-[#4f3a2e] transition hover:text-[#1B6CA8] dark:text-[#d6e1f0] dark:hover:text-[#8ec9f4]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">{rightSlot}</div>
        <div className="md:hidden">
          <KCButton variant="ghost" size="sm" onClick={() => setOpen((prev) => !prev)} aria-label="Open menu">
            ☰
          </KCButton>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <div className="md:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
              aria-label="Close mobile menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="fixed right-0 top-0 z-50 h-full w-[78%] border-l border-white/30 bg-white/95 p-4 backdrop-blur-md dark:border-[#22334c] dark:bg-[#0d1728]/95"
            >
              <div className="mb-4 flex justify-end">
                <KCButton variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  ✕
                </KCButton>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm text-[#4f3a2e] hover:bg-[#f2e8da] dark:text-[#d6e1f0] dark:hover:bg-[#15233a]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                {rightSlot ? <div className="pt-3">{rightSlot}</div> : null}
              </div>
            </div>
          </div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
