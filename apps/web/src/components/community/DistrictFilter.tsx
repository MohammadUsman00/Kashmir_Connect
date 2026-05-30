"use client";

import * as React from "react";
import { KCBadge, KCButton } from "@kashmir/ui";
import { JK_DISTRICTS, QUICK_DISTRICTS } from "@/lib/community/locations";

export function DistrictFilter({
  selectedDistrict,
  onSelectDistrict,
  onNearMe
}: {
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onNearMe: () => void;
}): JSX.Element {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#dfcfb8] bg-white/90 p-3 dark:border-[#27405f] dark:bg-[#102238]/90">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6f5c4f] dark:text-[#a4b8d1]">District map</p>
        <svg viewBox="0 0 320 180" className="w-full rounded-lg border border-[#eadfce] bg-[#f8f2e8] dark:border-[#223852] dark:bg-[#13263e]">
          {JK_DISTRICTS.map((district, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const x = 8 + col * 62;
            const y = 8 + row * 40;
            const active = selectedDistrict === district;
            return (
              <g key={district} onClick={() => onSelectDistrict(district)} style={{ cursor: "pointer" }}>
                <rect
                  x={x}
                  y={y}
                  width={56}
                  height={34}
                  rx={8}
                  fill={active ? "#C8972A" : "#e9dbc6"}
                  stroke={active ? "#7a5816" : "#c7b39a"}
                />
                <text x={x + 28} y={y + 20} fontSize={9} textAnchor="middle" fill={active ? "#251408" : "#5f4b3d"}>
                  {district}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_DISTRICTS.map((district) => (
          <button key={district} onClick={() => onSelectDistrict(district)}>
            <KCBadge variant={selectedDistrict === district ? "featured" : "sector"}>{district}</KCBadge>
          </button>
        ))}
        <KCButton size="sm" variant="ghost" onClick={onNearMe}>
          Near me
        </KCButton>
      </div>
    </div>
  );
}
