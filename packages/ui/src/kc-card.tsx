"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "./utils";

type KCCardVariant = "default" | "glass" | "elevated";

const cardVariants: Record<KCCardVariant, string> = {
  default: "border border-[#eadfce] bg-white/90 dark:border-[#21324b] dark:bg-[#101a2a]/80",
  glass:
    "border border-white/40 bg-white/20 backdrop-blur-md dark:border-[#2b3d59]/50 dark:bg-[#0f1a2b]/35 dark:backdrop-blur-md",
  elevated:
    "border border-[#eadfce] bg-white shadow-xl shadow-[#3D1F0D]/10 dark:border-[#21324b] dark:bg-[#101a2a] dark:shadow-[#081221]/30"
};

export function KCCard({
  className,
  variant = "default",
  children
}: {
  className?: string;
  variant?: KCCardVariant;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("rounded-2xl p-6", cardVariants[variant], className)}
    >
      {children}
    </motion.div>
  );
}
