"use client";

import { motion } from "framer-motion";

export function KCSectionHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}): JSX.Element {
  return (
    <div className="space-y-3 text-center">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B6CA8] dark:text-[#8bc5ef]">{eyebrow}</p> : null}
      <h2 className="text-balance text-3xl font-semibold text-[#3D1F0D] dark:text-[#f9e7c4] md:text-4xl">{title}</h2>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: 120 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="mx-auto h-1 rounded-full bg-gradient-to-r from-[#C8972A] via-[#1B6CA8] to-[#C0392B]"
      />
      {description ? <p className="mx-auto max-w-2xl text-sm text-[#5d4a3f] dark:text-[#c9d5e8] md:text-base">{description}</p> : null}
    </div>
  );
}
