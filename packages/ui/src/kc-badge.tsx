import { cn } from "./utils";

type KCBadgeVariant = "verified" | "pending" | "featured" | "sector";

const styles: Record<KCBadgeVariant, string> = {
  verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
  featured: "bg-[#C8972A]/20 text-[#6a4a0d] dark:bg-[#C8972A]/30 dark:text-[#f5ddb1]",
  sector: "bg-[#1B6CA8]/15 text-[#0e4670] dark:bg-[#1B6CA8]/30 dark:text-[#b8dfff]"
};

export function KCBadge({
  children,
  variant = "sector",
  className
}: {
  children: string;
  variant?: KCBadgeVariant;
  className?: string;
}): JSX.Element {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", styles[variant], className)}>
      {children}
    </span>
  );
}
