"use client";

import * as React from "react";
import mapboxgl, { type GeoJSONSource, type LngLatLike } from "mapbox-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { motion } from "framer-motion";
import { KCButton, KCCard, KCBadge } from "@kashmir/ui";
import { trpcClient } from "@/lib/trpc-client";
import { DEFAULT_LAYER_STATE, FALLBACK_HEATMAP_DATA, KASHMIR_CENTER, LAYER_LABELS, LAYER_POINT_DATA, TREKKING_DATA } from "./data";
import type { HeatPoint, LayerId, LayerState, MapPointFeature, PlaceCategory } from "./types";
import { applyPointFilters, formatStars } from "./utils";
import { MapSidebar } from "./map-sidebar";
import { MobileMapSheet } from "./mobile-map-sheet";
import { DirectionsPanel } from "./directions-panel";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const CATEGORY_LIST: PlaceCategory[] = [
  "TOURIST_ATTRACTIONS",
  "HOSPITALS",
  "MOSQUES",
  "HOTELS",
  "RESTAURANTS",
  "SCHOOLS",
  "COLLEGES",
  "GOVERNMENT_OFFICES",
  "EMERGENCY_CENTERS"
];

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  TOURIST_ATTRACTIONS: "#1B6CA8",
  HOSPITALS: "#C0392B",
  MOSQUES: "#2F855A",
  HOTELS: "#C8972A",
  RESTAURANTS: "#D97706",
  SCHOOLS: "#6366F1",
  COLLEGES: "#7C3AED",
  GOVERNMENT_OFFICES: "#334155",
  EMERGENCY_CENTERS: "#DC2626"
};

type RouteSummary = {
  profile: "fastest" | "scenic";
  distanceKm: number;
  durationMin: number;
  steps: string[];
  geometry: GeoJSON.LineString;
};

function sourceId(layer: LayerId): string {
  return `source-${layer.toLowerCase()}`;
}

function layerId(layer: LayerId): string {
  return `layer-${layer.toLowerCase()}`;
}

function makePopupHtml(feature: MapPointFeature): string {
  const props = feature.properties;
  const photo = props.photos?.[0];
  const coordinates = feature.geometry.coordinates as [number, number];
  const directionUrl = `https://www.mapbox.com/directions/?origin=${coordinates[1]},${coordinates[0]}&destination=${coordinates[1]},${coordinates[0]}&profile=driving`;
  const shareUrl = `https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}`;

  return `
    <div style="max-width:260px;font-family:system-ui">
      ${photo ? `<img src="${photo}" alt="${props.name}" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-bottom:8px;" />` : ""}
      <h3 style="margin:0 0 6px;font-size:15px">${props.name}</h3>
      <p style="margin:0 0 4px;font-size:12px;color:#666">${LAYER_LABELS[props.category]}</p>
      <p style="margin:0 0 4px;font-size:12px">${"★".repeat(Math.round(props.rating ?? 0))}</p>
      <p style="margin:0 0 4px;font-size:12px">${props.phone ?? "No phone available"}</p>
      <p style="margin:0 0 8px;font-size:12px">${props.address ?? ""}</p>
      <div style="display:flex;gap:8px">
        <a href="${directionUrl}" target="_blank" rel="noopener" style="font-size:12px;color:#1B6CA8">Get Directions</a>
        <a href="${shareUrl}" target="_blank" rel="noopener" style="font-size:12px;color:#C0392B">Share</a>
      </div>
    </div>
  `;
}

export function SmartMap(): JSX.Element {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const overlayRef = React.useRef<MapboxOverlay | null>(null);
  const userMarkerRef = React.useRef<mapboxgl.Marker | null>(null);

  const [layers, setLayers] = React.useState<LayerState>(DEFAULT_LAYER_STATE);
  const [search, setSearch] = React.useState("");
  const [radiusKm, setRadiusKm] = React.useState(25);
  const [minRating, setMinRating] = React.useState(0);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([1, 4]);
  const [nearCenter, setNearCenter] = React.useState<[number, number] | null>(null);
  const [heatmapData, setHeatmapData] = React.useState(FALLBACK_HEATMAP_DATA);
  const [autoCenter, setAutoCenter] = React.useState(true);
  const [selectedFeature, setSelectedFeature] = React.useState<MapPointFeature | null>(null);
  const [routePoints, setRoutePoints] = React.useState<[number, number][]>([]);
  const [routes, setRoutes] = React.useState<RouteSummary[]>([]);
  const [selectedRoute, setSelectedRoute] = React.useState<"fastest" | "scenic">("fastest");

  const filteredCollections = React.useMemo(() => {
    const out: Record<PlaceCategory, GeoJSON.FeatureCollection<GeoJSON.Point, MapPointFeature["properties"]>> = {} as Record<
      PlaceCategory,
      GeoJSON.FeatureCollection<GeoJSON.Point, MapPointFeature["properties"]>
    >;

    for (const category of CATEGORY_LIST) {
      out[category] = {
        type: "FeatureCollection",
        features: applyPointFilters(LAYER_POINT_DATA[category].features, {
          query: search,
          minRating,
          nearCenter,
          radiusKm,
          priceRange
        })
      };
    }
    return out;
  }, [search, minRating, nearCenter, radiusKm, priceRange]);

  const counts = React.useMemo(() => {
    const result = {} as Record<LayerId, number>;
    for (const category of CATEGORY_LIST) {
      result[category] = filteredCollections[category].features.length;
    }
    result.TREKKING_ROUTES = TREKKING_DATA.features.length;
    return result;
  }, [filteredCollections]);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/map-sw.js").catch(() => undefined);
  }, []);

  React.useEffect(() => {
    const loadHeatmap = async () => {
      try {
        const response = await trpcClient.analytics.mapHeatmaps.query({ days: 30 });
        setHeatmapData({
          touristDensity: response.touristDensity.length ? response.touristDensity : FALLBACK_HEATMAP_DATA.touristDensity,
          emergencyIncidents: response.emergencyIncidents.length ? response.emergencyIncidents : FALLBACK_HEATMAP_DATA.emergencyIncidents,
          businessActivity: response.businessActivity.length ? response.businessActivity : FALLBACK_HEATMAP_DATA.businessActivity
        });
      } catch {
        setHeatmapData(FALLBACK_HEATMAP_DATA);
      }
    };
    void loadHeatmap();
  }, []);

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: KASHMIR_CENTER as LngLatLike,
      zoom: 9,
      pitch: 52
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 14
      });
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.28 });
      map.setFog({
        color: "rgb(220, 235, 250)",
        "high-color": "rgb(175, 212, 239)",
        "horizon-blend": 0.22,
        "space-color": "rgb(12, 22, 42)",
        "star-intensity": 0.25
      });

      for (const category of CATEGORY_LIST) {
        map.addSource(sourceId(category), {
          type: "geojson",
          data: filteredCollections[category]
        });

        map.addLayer({
          id: layerId(category),
          type: "circle",
          source: sourceId(category),
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 4, 11, 8],
            "circle-color": CATEGORY_COLORS[category],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.2
          }
        });

        map.on("click", layerId(category), (evt) => {
          const feature = evt.features?.[0] as MapPointFeature | undefined;
          if (!feature) return;
          setSelectedFeature(feature);
          new mapboxgl.Popup({ offset: 10 })
            .setLngLat(feature.geometry.coordinates as [number, number])
            .setHTML(makePopupHtml(feature))
            .addTo(map);

          setRoutePoints((prev) => {
            const next = [...prev, feature.geometry.coordinates as [number, number]];
            return next.length > 2 ? [next[next.length - 2], next[next.length - 1]] : next;
          });
        });

        map.on("mouseenter", layerId(category), () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId(category), () => {
          map.getCanvas().style.cursor = "";
        });
      }

      map.addSource(sourceId("TREKKING_ROUTES"), { type: "geojson", data: TREKKING_DATA });
      map.addLayer({
        id: layerId("TREKKING_ROUTES"),
        source: sourceId("TREKKING_ROUTES"),
        type: "line",
        paint: {
          "line-color": "#1B6CA8",
          "line-width": 3.2,
          "line-opacity": 0.85
        }
      });

      overlayRef.current = new MapboxOverlay({
        interleaved: true,
        layers: []
      });
      map.addControl(overlayRef.current);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [filteredCollections]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    for (const category of CATEGORY_LIST) {
      const source = map.getSource(sourceId(category)) as GeoJSONSource | undefined;
      source?.setData(filteredCollections[category]);
    }
  }, [filteredCollections]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const id of Object.keys(layers) as LayerId[]) {
      const lid = layerId(id);
      if (map.getLayer(lid)) {
        map.setLayoutProperty(lid, "visibility", layers[id] ? "visible" : "none");
      }
    }
  }, [layers]);

  React.useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const touristLayer = new HeatmapLayer<HeatPoint>({
      id: "tourist-density",
      data: heatmapData.touristDensity,
      getPosition: (d) => [d.lng, d.lat],
      getWeight: (d) => d.weight,
      radiusPixels: 42,
      intensity: 1.8,
      colorRange: [
        [224, 242, 254, 25],
        [125, 211, 252, 65],
        [56, 189, 248, 120],
        [2, 132, 199, 180],
        [3, 105, 161, 220]
      ]
    });
    const emergencyLayer = new HeatmapLayer<HeatPoint>({
      id: "emergency-density",
      data: heatmapData.emergencyIncidents,
      getPosition: (d) => [d.lng, d.lat],
      getWeight: (d) => d.weight,
      radiusPixels: 34,
      intensity: 1.5,
      colorRange: [
        [254, 226, 226, 30],
        [254, 202, 202, 70],
        [252, 165, 165, 120],
        [248, 113, 113, 180],
        [185, 28, 28, 220]
      ]
    });
    const businessLayer = new HeatmapLayer<HeatPoint>({
      id: "business-activity",
      data: heatmapData.businessActivity,
      getPosition: (d) => [d.lng, d.lat],
      getWeight: (d) => d.weight,
      radiusPixels: 30,
      intensity: 1.6
    });
    overlay.setProps({ layers: [touristLayer, emergencyLayer, businessLayer] });
  }, [heatmapData]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || routePoints.length < 2 || !mapboxgl.accessToken) return;
    const [start, end] = routePoints;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=true&geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`;

    void fetch(url)
      .then((res) => res.json())
      .then((payload: { routes?: Array<{ distance: number; duration: number; geometry: GeoJSON.LineString; legs: Array<{ steps: Array<{ maneuver: { instruction: string } }> }> }> }) => {
        const apiRoutes = payload.routes ?? [];
        const summaries: RouteSummary[] = apiRoutes.slice(0, 2).map((route, index) => ({
          profile: index === 0 ? "fastest" : "scenic",
          distanceKm: route.distance / 1000,
          durationMin: route.duration / 60,
          steps: route.legs.flatMap((leg) => leg.steps.map((step) => step.maneuver.instruction)).slice(0, 8),
          geometry: route.geometry
        }));

        setRoutes(summaries);
        if (summaries.length > 0) {
          const featureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
            type: "FeatureCollection",
            features: summaries.map((route) => ({ type: "Feature", properties: { profile: route.profile }, geometry: route.geometry }))
          };

          const srcId = "route-source";
          if (!map.getSource(srcId)) {
            map.addSource(srcId, { type: "geojson", data: featureCollection });
            map.addLayer({
              id: "route-layer",
              type: "line",
              source: srcId,
              paint: {
                "line-color": ["match", ["get", "profile"], "fastest", "#1B6CA8", "#C8972A"],
                "line-width": 5,
                "line-opacity": 0.85
              }
            });
          } else {
            (map.getSource(srcId) as GeoJSONSource).setData(featureCollection);
          }
        }
      })
      .catch(() => undefined);
  }, [routePoints]);

  const onToggleLayer = (layer: LayerId) => setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));

  const onNearMe = React.useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center: [number, number] = [position.coords.longitude, position.coords.latitude];
        setNearCenter(center);
        const map = mapRef.current;
        if (map) {
          map.flyTo({ center, zoom: 12, essential: true });
        }

        if (userMarkerRef.current) userMarkerRef.current.remove();
        const markerNode = document.createElement("div");
        markerNode.className = "kc-user-dot";
        markerNode.innerHTML = `<span class="kc-user-dot-core"></span><span class="kc-user-dot-heading" style="transform: rotate(${position.coords.heading ?? 0}deg)"></span>`;
        userMarkerRef.current = new mapboxgl.Marker({ element: markerNode }).setLngLat(center).addTo(map!);

        if (autoCenter && map) {
          map.easeTo({ center });
        }
      },
      () => undefined,
      { enableHighAccuracy: true }
    );
  }, [autoCenter]);

  const onGeocode = React.useCallback(async () => {
    const q = search.trim();
    if (!q || !mapboxgl.accessToken) return;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      q
    )}.json?bbox=73.8,33.2,76.4,35.6&limit=5&access_token=${mapboxgl.accessToken}`;
    try {
      const response = await fetch(url);
      const payload = (await response.json()) as { features?: Array<{ center: [number, number] }> };
      const center = payload.features?.[0]?.center;
      if (center && mapRef.current) mapRef.current.flyTo({ center, zoom: 12 });
    } catch {
      return;
    }
  }, [search]);

  const onShare = () => {
    if (!selectedFeature) return;
    const coords = selectedFeature.geometry.coordinates as [number, number];
    const url = `https://www.google.com/maps?q=${coords[1]},${coords[0]}`;
    void navigator.clipboard.writeText(url);
  };

  const selectedDirections = selectedFeature
    ? `https://www.mapbox.com/directions/?destination=${(selectedFeature.geometry.coordinates as [number, number])[1]},${
        (selectedFeature.geometry.coordinates as [number, number])[0]
      }&profile=driving`
    : "#";

  return (
    <div className="relative flex h-[calc(100vh-64px)]">
      <MapSidebar
        layers={layers}
        counts={counts}
        search={search}
        setSearch={setSearch}
        radiusKm={radiusKm}
        setRadiusKm={setRadiusKm}
        minRating={minRating}
        setMinRating={setMinRating}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        onToggleLayer={onToggleLayer}
        onNearMe={onNearMe}
        onGeocode={onGeocode}
      />

      <div className="relative flex-1">
        <div ref={mapContainerRef} className="h-full w-full" />
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
          <KCButton size="sm" variant="secondary" onClick={onNearMe}>
            Near me
          </KCButton>
          <KCButton size="sm" variant="ghost" onClick={() => setAutoCenter((prev) => !prev)}>
            Auto-center: {autoCenter ? "On" : "Off"}
          </KCButton>
        </div>

        <DirectionsPanel routes={routes} selected={selectedRoute} onSelect={setSelectedRoute} />

        {selectedFeature ? (
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 240 }}
            className="absolute bottom-20 left-4 z-20 w-[320px] lg:left-auto lg:right-4"
          >
            <KCCard className="space-y-3 bg-white/95 dark:bg-[#0d1728]/95">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">{selectedFeature.properties.name}</h3>
                  <KCBadge variant="sector">{LAYER_LABELS[selectedFeature.properties.category]}</KCBadge>
                </div>
                <span className="text-xs text-[#6a5547] dark:text-[#bccde3]">
                  {formatStars(selectedFeature.properties.rating)} {selectedFeature.properties.rating?.toFixed(1)}
                </span>
              </div>
              {selectedFeature.properties.photos?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedFeature.properties.photos[0]}
                  alt={selectedFeature.properties.name}
                  className="h-28 w-full rounded-lg object-cover"
                />
              ) : null}
              <p className="text-xs text-[#5c483b] dark:text-[#c2d0e4]">{selectedFeature.properties.address}</p>
              <p className="text-xs text-[#5c483b] dark:text-[#c2d0e4]">{selectedFeature.properties.phone}</p>
              <div className="flex gap-2">
                <a href={selectedDirections} target="_blank" rel="noopener noreferrer">
                  <KCButton size="sm">Get Directions</KCButton>
                </a>
                <KCButton size="sm" variant="ghost" onClick={onShare}>
                  Share
                </KCButton>
              </div>
            </KCCard>
          </motion.div>
        ) : null}
      </div>

      <MobileMapSheet layers={layers} search={search} setSearch={setSearch} onToggleLayer={onToggleLayer} onNearMe={onNearMe} />
    </div>
  );
}
