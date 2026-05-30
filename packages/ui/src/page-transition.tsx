"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

export function KCPageTransition({
  children,
  routeKey
}: {
  children: React.ReactNode;
  routeKey: string;
}): JSX.Element {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
