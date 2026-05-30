import Typesense from "typesense";
import { Redis } from "@upstash/redis";
import { prisma } from "@kashmir/db";

export type StorefrontSearchDocument = {
  id: string;
  name: string;
  description: string;
  sector: string;
  products: string[];
  district: string;
  verified: boolean;
  rating: number;
};

const COLLECTION = "storefronts";
const redis = Redis.fromEnv();

export const typesenseServerClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || "localhost",
      port: Number(process.env.TYPESENSE_PORT || 8108),
      protocol: process.env.TYPESENSE_PROTOCOL || "http"
    }
  ],
  apiKey: process.env.TYPESENSE_API_KEY || "xyz",
  connectionTimeoutSeconds: 8
});

export function getTypesenseSearchConfig() {
  return {
    nodes: [
      {
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost",
        port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT || 8108),
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http"
      }
    ],
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY || "xyz",
    connectionTimeoutSeconds: 5
  };
}

export async function ensureStorefrontCollection(): Promise<void> {
  const collections = await typesenseServerClient.collections().retrieve();
  if (collections.find((collection) => collection.name === COLLECTION)) return;

  await typesenseServerClient.collections().create({
    name: COLLECTION,
    fields: [
      { name: "id", type: "string" },
      { name: "name", type: "string" },
      { name: "description", type: "string", optional: true },
      { name: "sector", type: "string", facet: true },
      { name: "products", type: "string[]", facet: false, optional: true },
      { name: "district", type: "string", facet: true },
      { name: "verified", type: "bool", facet: true },
      { name: "rating", type: "float", facet: true }
    ],
    default_sorting_field: "rating"
  });
}

export async function indexStorefrontById(storefrontId: string): Promise<void> {
  await ensureStorefrontCollection();
  const storefront = await prisma.storefront.findUnique({
    where: { id: storefrontId },
    include: {
      products: { where: { hidden: false }, select: { name: true } },
      reviews: { where: { approved: true }, select: { rating: true } }
    }
  });
  if (!storefront) return;

  const rating =
    storefront.reviews.length > 0
      ? storefront.reviews.reduce((sum, review) => sum + review.rating, 0) / storefront.reviews.length
      : 0;

  const doc: StorefrontSearchDocument = {
    id: storefront.id,
    name: storefront.name,
    description: storefront.description ?? "",
    sector: storefront.sector,
    products: storefront.products.map((product) => product.name),
    district: extractDistrictFromDescription(storefront.description),
    verified: storefront.verified,
    rating
  };

  await typesenseServerClient.collections(COLLECTION).documents().upsert(doc);
}

function extractDistrictFromDescription(description: string | null): string {
  if (!description) return "Srinagar";
  const knownDistricts = [
    "Srinagar",
    "Anantnag",
    "Baramulla",
    "Kupwara",
    "Pulwama",
    "Shopian",
    "Ganderbal",
    "Bandipora",
    "Kulgam"
  ];
  const hit = knownDistricts.find((district) => description.toLowerCase().includes(district.toLowerCase()));
  return hit ?? "Srinagar";
}

export async function searchStorefrontsTypesense(input: {
  query: string;
  sector?: string;
  district?: string;
  verified?: boolean;
  perPage?: number;
  page?: number;
}): Promise<{
  hits: Array<{ document: StorefrontSearchDocument }>;
  found: number;
}> {
  await ensureStorefrontCollection();
  const filters: string[] = [];
  if (input.sector) filters.push(`sector:=${input.sector}`);
  if (input.district) filters.push(`district:=${input.district}`);
  if (typeof input.verified === "boolean") filters.push(`verified:=${input.verified}`);

  const searchParameters = {
    q: input.query || "*",
    query_by: "name,description,products,district",
    prefix: true,
    typo_tokens_threshold: 1,
    num_typos: 2,
    per_page: input.perPage ?? 12,
    page: input.page ?? 1,
    filter_by: filters.length ? filters.join(" && ") : undefined
  };

  const result = await typesenseServerClient.collections(COLLECTION).documents().search(searchParameters);
  if (input.query?.trim()) {
    await redis.zincrby("search:trending", 1, input.query.trim().toLowerCase());
  }
  return {
    hits: (result.hits ?? []) as Array<{ document: StorefrontSearchDocument }>,
    found: result.found ?? 0
  };
}

export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  waitMs: number
): (...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

export function saveRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const key = "kc-recent-searches";
  const existing = JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
  const next = [query, ...existing.filter((item) => item !== query)].slice(0, 8);
  window.localStorage.setItem(key, JSON.stringify(next));
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(window.localStorage.getItem("kc-recent-searches") ?? "[]") as string[];
}

export async function getTrendingSearches(limit = 8): Promise<string[]> {
  const items = await redis.zrange<string[]>("search:trending", 0, limit - 1, { rev: true });
  return items ?? [];
}
