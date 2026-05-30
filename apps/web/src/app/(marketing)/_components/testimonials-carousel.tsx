"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KCAvatar, KCCard, KCButton, KCSkeleton } from "@kashmir/ui";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
};

const testimonialSeed: Testimonial[] = [
  {
    id: "1",
    name: "Aaliya Mir",
    role: "Pashmina Artisan, Srinagar",
    text: "My shawl orders now come from Delhi, Mumbai, and Dubai because Kashmir Connect made my storefront easy and trustworthy."
  },
  {
    id: "2",
    name: "Firdous Ahmad",
    role: "Guesthouse Owner, Pahalgam",
    text: "Tourists discover our homestay before arriving. Verified badge and fast inquiry flow improved booking confidence."
  },
  {
    id: "3",
    name: "Shazia Bhat",
    role: "Dry Fruit Merchant, Anantnag",
    text: "Inventory, customer leads, and product sharing on WhatsApp are all in one place. It feels simple but powerful."
  }
];

export function TestimonialsCarousel(): JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (loading) return;
    const t = window.setInterval(() => {
      setActive((prev) => (prev + 1) % testimonialSeed.length);
    }, 4500);
    return () => clearInterval(t);
  }, [loading]);

  if (loading) {
    return (
      <div className="grid gap-3">
        <KCSkeleton className="h-36 w-full" />
        <KCSkeleton className="h-10 w-40" />
      </div>
    );
  }

  const item = testimonialSeed[active];

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <KCCard variant="glass" className="space-y-4">
            <p className="text-lg leading-relaxed text-[#3D1F0D] dark:text-[#f2dfbc]">“{item.text}”</p>
            <div className="flex items-center gap-3">
              <KCAvatar name={item.name} online />
              <div>
                <p className="font-semibold text-[#3D1F0D] dark:text-[#f6e3bf]">{item.name}</p>
                <p className="text-sm text-[#5b473a] dark:text-[#bbcae0]">{item.role}</p>
              </div>
            </div>
          </KCCard>
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center gap-2">
        {testimonialSeed.map((entry, index) => (
          <button
            key={entry.id}
            className={`h-2.5 rounded-full transition-all ${index === active ? "w-8 bg-[#C8972A]" : "w-2.5 bg-[#d6b885] dark:bg-[#2f4662]"}`}
            aria-label={`Go to testimonial ${index + 1}`}
            onClick={() => setActive(index)}
          />
        ))}
        <div className="ml-auto">
          <KCButton variant="ghost" size="sm" onClick={() => setActive((active + 1) % testimonialSeed.length)}>
            Next
          </KCButton>
        </div>
      </div>
    </div>
  );
}
