"use client";

import * as React from "react";
import Typesense from "typesense";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { KCCard } from "@kashmir/ui";
import {
  debounce,
  getRecentSearches,
  getTypesenseSearchConfig,
  saveRecentSearch
} from "@/lib/search/typesense";

type Suggestion = {
  id: string;
  name: string;
  sector: string;
  district: string;
};

const client = new Typesense.Client(getTypesenseSearchConfig());

export function SearchBar({
  trendingSearches
}: {
  trendingSearches: string[];
}): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("search") ?? "");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  React.useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const updateUrl = React.useMemo(
    () =>
      debounce((value: string) => {
        const next = new URLSearchParams(searchParams.toString());
        if (value.trim()) {
          next.set("search", value.trim());
          saveRecentSearch(value.trim());
          setRecentSearches(getRecentSearches());
        } else {
          next.delete("search");
        }
        router.replace(`${pathname}?${next.toString()}`);
      }, 150),
    [pathname, router, searchParams]
  );

  React.useEffect(() => {
    const run = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const result = await client.collections("storefronts").documents().search({
          q: query,
          query_by: "name,description,products,district",
          per_page: 6,
          typo_tokens_threshold: 1,
          num_typos: 2
        });
        setSuggestions(
          (result.hits ?? []).map((hit) => {
            const doc = hit.document as Record<string, unknown>;
            return {
              id: String(doc.id ?? ""),
              name: String(doc.name ?? ""),
              sector: String(doc.sector ?? ""),
              district: String(doc.district ?? "")
            };
          })
        );
      } catch {
        setSuggestions([]);
      }
    };
    void run();
  }, [query]);

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          updateUrl(event.target.value);
        }}
        placeholder="Search pashmina, saffron, carpets..."
        className="h-11 w-full rounded-xl border border-[#dfd0ba] bg-white px-4 text-sm dark:border-[#2a4160] dark:bg-[#112036]"
      />

      {(suggestions.length > 0 || recentSearches.length > 0 || trendingSearches.length > 0) ? (
        <KCCard className="space-y-3">
          {suggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#705c4f] dark:text-[#9fb6d1]">Instant search</p>
              <div className="space-y-1">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    className="w-full rounded-lg border border-[#e5d8c6] px-3 py-2 text-left text-sm hover:bg-[#fff8ef] dark:border-[#2c4564] dark:hover:bg-[#13263f]"
                    onClick={() => {
                      setQuery(item.name);
                      updateUrl(item.name);
                    }}
                  >
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-[#6e5a4c] dark:text-[#a9bfd7]">
                      {item.sector} • {item.district}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {recentSearches.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#705c4f] dark:text-[#9fb6d1]">Recent</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    className="rounded-full border border-[#e1d2bc] px-3 py-1 text-xs dark:border-[#2b4360]"
                    onClick={() => {
                      setQuery(item);
                      updateUrl(item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {trendingSearches.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#705c4f] dark:text-[#9fb6d1]">Trending</p>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((item) => (
                  <button
                    key={`trend-${item}`}
                    className="rounded-full bg-[#f5ead5] px-3 py-1 text-xs text-[#3D1F0D] dark:bg-[#1d334f] dark:text-[#d5e6f8]"
                    onClick={() => {
                      setQuery(item);
                      updateUrl(item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </KCCard>
      ) : null}
    </div>
  );
}
