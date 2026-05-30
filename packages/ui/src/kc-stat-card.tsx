"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { KCCard } from "./kc-card";
import { KCSkeleton } from "./kc-skeleton";

function useAnimatedCount(target: number, active: boolean): number {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(target * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);

  return value;
}

export function KCStatCard({
  label,
  value,
  suffix = "",
  loading = false
}: {
  label: string;
  value: number;
  suffix?: string;
  loading?: boolean;
}): JSX.Element {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const count = useAnimatedCount(value, inView);

  if (loading) {
    return (
      <KCCard className="space-y-2">
        <KCSkeleton className="h-8 w-2/3" />
        <KCSkeleton className="h-4 w-1/2" />
      </KCCard>
    );
  }

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}>
      <KCCard variant="glass">
        <p className="text-3xl font-bold tracking-tight text-[#3D1F0D] dark:text-[#f6e2b6]">
          {count.toLocaleString()}
          {suffix}
        </p>
        <p className="text-sm text-[#5b4638] dark:text-[#c7d2e2]">{label}</p>
      </KCCard>
    </motion.div>
  );
}
