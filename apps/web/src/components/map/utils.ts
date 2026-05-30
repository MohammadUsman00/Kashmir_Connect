import type { MapPointFeature } from "./types";

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const sa = Math.sin(dLat / 2) * Math.sin(dLat / 2);
  const sb =
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(sa + sb), Math.sqrt(1 - sa - sb));
  return EARTH_RADIUS_KM * c;
}

export function formatStars(value = 0): string {
  const rounded = Math.round(value);
  return "★".repeat(rounded) + "☆".repeat(Math.max(0, 5 - rounded));
}

export function applyPointFilters(
  features: MapPointFeature[],
  options: {
    query: string;
    minRating: number;
    priceRange: [number, number];
    nearCenter: [number, number] | null;
    radiusKm: number;
  }
): MapPointFeature[] {
  const queryLower = options.query.trim().toLowerCase();

  return features.filter((feature) => {
    const props = feature.properties;
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    const rating = props.rating ?? 0;
    const priceScore =
      props.priceRange === "budget" ? 1 : props.priceRange === "mid" ? 2 : props.priceRange === "premium" ? 3 : props.priceRange === "luxury" ? 4 : 2;

    if (queryLower && !(`${props.name} ${props.address ?? ""}`.toLowerCase().includes(queryLower))) {
      return false;
    }
    if (rating < options.minRating) return false;
    if (priceScore < options.priceRange[0] || priceScore > options.priceRange[1]) return false;

    if (options.nearCenter) {
      const d = haversineDistanceKm(options.nearCenter, [lng, lat]);
      if (d > options.radiusKm) return false;
    }
    return true;
  });
}
