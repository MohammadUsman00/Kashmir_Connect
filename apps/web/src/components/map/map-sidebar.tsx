"use client";

import { motion } from "framer-motion";
import { KCButton, KCBadge } from "@kashmir/ui";
import type { LayerId, LayerState } from "./types";
import { LAYER_LABELS } from "./data";

const layerIcons: Record<LayerId, string> = {
  TOURIST_ATTRACTIONS: "🧭",
  HOSPITALS: "🏥",
  MOSQUES: "🕌",
  HOTELS: "🏨",
  RESTAURANTS: "🍲",
  SCHOOLS: "🏫",
  COLLEGES: "🎓",
  GOVERNMENT_OFFICES: "🏛️",
  EMERGENCY_CENTERS: "🚨",
  TREKKING_ROUTES: "🥾"
};

export function MapSidebar({
  layers,
  counts,
  search,
  setSearch,
  radiusKm,
  setRadiusKm,
  minRating,
  setMinRating,
  priceRange,
  setPriceRange,
  onToggleLayer,
  onNearMe,
  onGeocode
}: {
  layers: LayerState;
  counts: Record<LayerId, number>;
  search: string;
  setSearch: (v: string) => void;
  radiusKm: number;
  setRadiusKm: (v: number) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  onToggleLayer: (layer: LayerId) => void;
  onNearMe: () => void;
  onGeocode: () => void;
}): JSX.Element {
  return (
    <aside className="hidden h-full w-[320px] shrink-0 overflow-y-auto border-r border-[#dfd4c2] bg-white/90 p-4 backdrop-blur-sm dark:border-[#1f324b] dark:bg-[#0d1728]/90 lg:block">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f1deb7]">Kashmir Smart Map</h2>
        <div className="space-y-2">
          <input
            className="h-10 w-full rounded-lg border border-[#d8c8b0] bg-white px-3 text-sm dark:border-[#27405f] dark:bg-[#111d2e]"
            value={search}
            placeholder="Search places in Kashmir"
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            <KCButton size="sm" variant="secondary" onClick={onGeocode}>
              Geocode
            </KCButton>
            <KCButton size="sm" variant="ghost" onClick={onNearMe}>
              Near me
            </KCButton>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6f5d50] dark:text-[#9db0cb]">Layers</p>
          <div className="space-y-2">
            {(Object.keys(layers) as LayerId[]).map((layer) => (
              <motion.button
                key={layer}
                whileHover={{ scale: 1.01 }}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${
                  layers[layer]
                    ? "border-[#C8972A] bg-[#f5ead5] dark:border-[#a8802a] dark:bg-[#1b2a40]"
                    : "border-[#e3d7c5] bg-white dark:border-[#27405f] dark:bg-[#111d2e]"
                }`}
                onClick={() => onToggleLayer(layer)}
              >
                <span className="text-sm text-[#3D1F0D] dark:text-[#f1deb7]">
                  {layerIcons[layer]} {LAYER_LABELS[layer]}
                </span>
                <KCBadge variant={layers[layer] ? "featured" : "pending"}>{String(counts[layer] ?? 0)}</KCBadge>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6f5d50] dark:text-[#9db0cb]">Radius</p>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map((r) => (
              <button
                key={r}
                className={`rounded-lg px-2 py-1 text-xs ${radiusKm === r ? "bg-[#3D1F0D] text-[#FAF6EF] dark:bg-[#C8972A] dark:text-[#0f1624]" : "bg-[#eee0cb] text-[#3D1F0D] dark:bg-[#1e324a] dark:text-[#d8e4f1]"}`}
                onClick={() => setRadiusKm(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6f5d50] dark:text-[#9db0cb]">
            Minimum rating: {minRating.toFixed(1)}★
          </label>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6f5d50] dark:text-[#9db0cb]">
            Price range ({priceRange[0]} - {priceRange[1]})
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="range"
              min={1}
              max={4}
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
            />
            <input
              type="range"
              min={1}
              max={4}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
