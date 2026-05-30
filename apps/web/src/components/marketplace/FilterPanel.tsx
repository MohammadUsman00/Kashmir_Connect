"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KCBadge } from "@kashmir/ui";

const sectors = [
  "Handicrafts",
  "Dry Fruits",
  "Tourism",
  "Agriculture",
  "Textiles",
  "Copperware",
  "Carpets",
  "Spices"
];

const districts = ["Srinagar", "Anantnag", "Baramulla", "Pulwama", "Kupwara", "Ganderbal", "Bandipora", "Shopian"];

export function FilterPanel(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(
    () => ({
      sector: searchParams.get("sector") ?? "",
      verified: searchParams.get("verified") === "true",
      district: searchParams.get("district") ?? "",
      sort: searchParams.get("sort") ?? "featured"
    }),
    [searchParams]
  );

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <aside className="space-y-4 rounded-2xl border border-[#e4d5c0] bg-white/90 p-4 dark:border-[#233852] dark:bg-[#0f1b2c]/90">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6e5a4d] dark:text-[#a8bdd6]">Sectors</p>
        <div className="flex flex-wrap gap-2">
          {sectors.map((sector) => {
            const active = state.sector === sector;
            return (
              <button key={sector} onClick={() => setParam("sector", active ? null : sector)}>
                <KCBadge variant={active ? "featured" : "sector"}>{sector}</KCBadge>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[#59463a] dark:text-[#c2d2e6]">
        <input type="checkbox" checked={state.verified} onChange={(event) => setParam("verified", event.target.checked ? "true" : null)} />
        Verified only
      </label>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6e5a4d] dark:text-[#a8bdd6]">District</p>
        <select
          value={state.district}
          onChange={(event) => setParam("district", event.target.value || null)}
          className="h-10 w-full rounded-lg border border-[#ddcdb8] bg-white px-3 text-sm dark:border-[#2a4260] dark:bg-[#102035]"
        >
          <option value="">All districts</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6e5a4d] dark:text-[#a8bdd6]">Sort</p>
        <select
          value={state.sort}
          onChange={(event) => setParam("sort", event.target.value)}
          className="h-10 w-full rounded-lg border border-[#ddcdb8] bg-white px-3 text-sm dark:border-[#2a4260] dark:bg-[#102035]"
        >
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="rating">Rating</option>
        </select>
      </div>
    </aside>
  );
}
