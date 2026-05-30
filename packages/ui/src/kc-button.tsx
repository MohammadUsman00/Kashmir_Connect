"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "./utils";

type KCButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type KCButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<KCButtonVariant, string> = {
  primary: "bg-[#3D1F0D] text-[#FAF6EF] hover:bg-[#2F1709] dark:bg-[#C8972A] dark:text-[#0B1220] dark:hover:bg-[#D8AB47]",
  secondary:
    "bg-[#C8972A] text-[#2F1709] hover:bg-[#b78623] dark:bg-[#1B6CA8] dark:text-white dark:hover:bg-[#165b8d]",
  ghost:
    "bg-transparent text-[#3D1F0D] hover:bg-[#efe3d1] border border-[#d8c3a7] dark:text-[#FAF6EF] dark:border-[#2c4361] dark:hover:bg-[#152237]",
  danger: "bg-[#C0392B] text-white hover:bg-[#a93427] dark:bg-[#C0392B] dark:hover:bg-[#a93427]"
};

const sizeClasses: Record<KCButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base"
};

export interface KCButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: KCButtonVariant;
  size?: KCButtonSize;
  loading?: boolean;
}

export const KCButton = React.forwardRef<HTMLButtonElement, KCButtonProps>(function KCButton(
  { className, variant = "primary", size = "md", loading = false, children, disabled, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
});
