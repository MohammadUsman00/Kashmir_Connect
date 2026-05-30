"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { KCCard, KCSkeleton } from "@kashmir/ui";

type MetricMode = "merchant" | "tourist" | "emergency";

export type DistrictMetric = {
  district: string;
  merchants: number;
  touristDensity: number;
  emergencyIncidents: number;
};

const DISTRICT_PATHS: Array<{ district: string; path: string }> = [
  { district: "Kupwara", path: "M18,20 L52,16 L66,34 L40,44 L16,36 Z" },
  { district: "Baramulla", path: "M56,34 L92,30 L104,52 L72,62 L46,52 Z" },
  { district: "Bandipora", path: "M92,24 L124,22 L134,42 L104,52 Z" },
  { district: "Srinagar", path: "M86,56 L112,54 L120,72 L96,84 L78,74 Z" },
  { district: "Ganderbal", path: "M116,48 L146,46 L154,66 L124,74 Z" },
  { district: "Budgam", path: "M66,68 L94,62 L102,84 L74,96 L58,86 Z" },
  { district: "Pulwama", path: "M100,84 L128,82 L138,102 L112,114 L94,102 Z" },
  { district: "Shopian", path: "M76,98 L108,98 L114,120 L86,132 L66,118 Z" },
  { district: "Kulgam", path: "M114,110 L144,108 L152,128 L126,140 L108,130 Z" },
  { district: "Anantnag", path: "M142,98 L174,96 L184,120 L154,132 L136,118 Z" },
  { district: "Poonch", path: "M12,92 L46,88 L54,112 L28,124 L8,112 Z" },
  { district: "Rajouri", path: "M48,100 L78,98 L88,122 L62,136 L42,122 Z" },
  { district: "Jammu", path: "M56,134 L94,132 L106,156 L72,170 L50,156 Z" },
  { district: "Samba", path: "M100,146 L130,142 L140,160 L114,172 L96,162 Z" },
  { district: "Kathua", path: "M132,144 L168,142 L178,164 L146,176 L124,162 Z" },
  { district: "Reasi", path: "M82,120 L112,118 L120,138 L94,148 L74,136 Z" },
  { district: "Udhampur", path: "M116,122 L150,120 L160,144 L130,154 L108,140 Z" },
  { district: "Ramban", path: "M152,122 L182,120 L192,142 L166,154 L148,142 Z" },
  { district: "Doda", path: "M184,108 L214,106 L224,128 L198,142 L178,128 Z" },
  { district: "Kishtwar", path: "M214,92 L246,90 L258,114 L232,128 L210,114 Z" }
];

function metricValue(item: DistrictMetric, mode: MetricMode): number {
  if (mode === "merchant") return item.merchants;
  if (mode === "tourist") return item.touristDensity;
  return item.emergencyIncidents;
}

function colorFromValue(value: number, max: number): string {
  const ratio = max === 0 ? 0 : value / max;
  const alpha = 0.12 + ratio * 0.88;
  return `rgba(27,108,168,${alpha.toFixed(3)})`;
}

export function DistrictMap({
  data,
  mode,
  onModeChange,
  loading = false
}: {
  data: DistrictMetric[];
  mode: MetricMode;
  onModeChange: (mode: MetricMode) => void;
  loading?: boolean;
}): JSX.Element {
  const [hover, setHover] = React.useState<{ district: string; value: number } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = React.useState<string | null>(null);
  const lookup = new Map(data.map((item) => [item.district, item]));
  const maxValue = Math.max(1, ...data.map((item) => metricValue(item, mode)));
  const selected = selectedDistrict ? lookup.get(selectedDistrict) : null;

  return (
    <KCCard className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">J&K District Analytics</h3>
        <div className="flex gap-2">
          <button className={`rounded-full px-3 py-1 text-xs ${mode === "merchant" ? "bg-[#3D1F0D] text-white" : "bg-[#ece0ce]"}`} onClick={() => onModeChange("merchant")}>
            Merchant Count
          </button>
          <button className={`rounded-full px-3 py-1 text-xs ${mode === "tourist" ? "bg-[#1B6CA8] text-white" : "bg-[#ece0ce]"}`} onClick={() => onModeChange("tourist")}>
            Tourist Density
          </button>
          <button className={`rounded-full px-3 py-1 text-xs ${mode === "emergency" ? "bg-[#C0392B] text-white" : "bg-[#ece0ce]"}`} onClick={() => onModeChange("emergency")}>
            Emergency Incidents
          </button>
        </div>
      </div>

      {loading ? (
        <KCSkeleton className="h-[420px] w-full rounded-xl" />
      ) : (
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <div className="relative rounded-xl border border-[#dfcfb8] bg-[#fbf5ec] p-2 dark:border-[#26405f] dark:bg-[#13253d]">
            <svg viewBox="0 0 280 190" className="h-[390px] w-full">
              {DISTRICT_PATHS.map((shape) => {
                const metrics = lookup.get(shape.district);
                const value = metrics ? metricValue(metrics, mode) : 0;
                const fill = colorFromValue(value, maxValue);
                return (
                  <motion.path
                    key={shape.district}
                    d={shape.path}
                    fill={fill}
                    stroke="#3D1F0D"
                    strokeWidth={selectedDistrict === shape.district ? 2 : 1}
                    onMouseEnter={() => setHover({ district: shape.district, value })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setSelectedDistrict(shape.district)}
                    whileHover={{ scale: 1.01 }}
                    style={{ cursor: "pointer" }}
                  />
                );
              })}
            </svg>

            {hover ? (
              <div className="absolute left-3 top-3 rounded-lg border border-[#d8c9b4] bg-white/95 px-3 py-2 text-xs dark:border-[#2b4464] dark:bg-[#102136]/95">
                <p className="font-semibold">{hover.district}</p>
                <p>
                  Value: {hover.value} {hover.value > maxValue * 0.6 ? "↑" : hover.value > maxValue * 0.3 ? "→" : "↓"}
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 rounded-xl border border-[#dfcfb8] bg-[#fffaf2] p-3 dark:border-[#26405f] dark:bg-[#11243b]">
            <p className="text-sm font-semibold">Legend</p>
            <div className="h-3 w-full rounded bg-gradient-to-r from-[#e8f1fa] via-[#5f97c1] to-[#1B6CA8]" />
            <div className="flex justify-between text-xs">
              <span>Low</span>
              <span>High</span>
            </div>
            <hr className="border-[#e6d8c5] dark:border-[#2a4260]" />
            {selected ? (
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{selected.district}</p>
                <p>Merchants: {selected.merchants}</p>
                <p>Tourist density: {selected.touristDensity}</p>
                <p>Emergency incidents: {selected.emergencyIncidents}</p>
              </div>
            ) : (
              <p className="text-xs text-[#6f5a4d] dark:text-[#a8bdd6]">Click a district to inspect its analytics.</p>
            )}
          </div>
        </div>
      )}
    </KCCard>
  );
}
