"use client";

import * as React from "react";
import { animated, useSpring } from "@react-spring/web";
import { KCButton } from "@kashmir/ui";
import type { LayerId, LayerState } from "./types";
import { LAYER_LABELS } from "./data";

export function MobileMapSheet({
  layers,
  search,
  setSearch,
  onToggleLayer,
  onNearMe
}: {
  layers: LayerState;
  search: string;
  setSearch: (v: string) => void;
  onToggleLayer: (layer: LayerId) => void;
  onNearMe: () => void;
}): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [{ y }, api] = useSpring(() => ({ y: 70 }));

  React.useEffect(() => {
    api.start({ y: open ? 0 : 70, config: { tension: 260, friction: 28 } });
  }, [open, api]);

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (event) => {
    const touchY = event.touches[0]?.clientY ?? 0;
    if (touchY > window.innerHeight * 0.75) {
      setOpen(false);
    }
  };

  return (
    <animated.div
      style={{ transform: y.to((value) => `translateY(${value}%)`) }}
      className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-[#d9c9b0] bg-white/95 p-4 shadow-2xl backdrop-blur lg:hidden dark:border-[#1f324b] dark:bg-[#0d1728]/95"
      onTouchMove={onTouchMove}
    >
      <button
        className="mx-auto mb-3 block h-1.5 w-14 rounded-full bg-[#c6ad86] dark:bg-[#355276]"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle map filters"
      />
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Kashmir places..."
          className="h-10 w-full rounded-lg border border-[#d8c7ad] px-3 text-sm dark:border-[#26405d] dark:bg-[#111d2e]"
        />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(layers) as LayerId[]).slice(0, 6).map((layer) => (
            <button
              key={layer}
              onClick={() => onToggleLayer(layer)}
              className={`rounded-full px-3 py-1 text-xs ${
                layers[layer]
                  ? "bg-[#3D1F0D] text-[#FAF6EF] dark:bg-[#C8972A] dark:text-[#0f1624]"
                  : "bg-[#efe3d1] text-[#3D1F0D] dark:bg-[#17304a] dark:text-[#cfe1f4]"
              }`}
            >
              {LAYER_LABELS[layer]}
            </button>
          ))}
        </div>
        <KCButton size="sm" variant="secondary" onClick={onNearMe}>
          Near me
        </KCButton>
      </div>
    </animated.div>
  );
}
