export type LayerId =
  | "TOURIST_ATTRACTIONS"
  | "HOSPITALS"
  | "MOSQUES"
  | "HOTELS"
  | "RESTAURANTS"
  | "SCHOOLS"
  | "COLLEGES"
  | "GOVERNMENT_OFFICES"
  | "EMERGENCY_CENTERS"
  | "TREKKING_ROUTES";

export type PlaceCategory = Exclude<LayerId, "TREKKING_ROUTES">;

export type MapPointProperties = {
  id: string;
  name: string;
  category: PlaceCategory;
  rating?: number;
  phone?: string;
  address?: string;
  hours?: string;
  emergency?: boolean;
  beds?: number;
  priceRange?: "budget" | "mid" | "premium" | "luxury";
  stars?: 3 | 4 | 5;
  medium?: "Urdu" | "English" | "Kashmiri" | "Mixed";
  photos?: string[];
};

export type MapPointFeature = GeoJSON.Feature<GeoJSON.Point, MapPointProperties>;
export type MapLineFeature = GeoJSON.Feature<
  GeoJSON.LineString,
  { id: string; name: string; difficulty: "easy" | "moderate" | "hard"; category: "TREKKING_ROUTES" }
>;

export type LayerState = Record<LayerId, boolean>;

export type HeatPoint = {
  lng: number;
  lat: number;
  weight: number;
};
