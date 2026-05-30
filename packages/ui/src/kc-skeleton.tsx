import { cn } from "./utils";

export function KCSkeleton({ className }: { className?: string }): JSX.Element {
  return <div className={cn("animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-700/60", className)} />;
}
