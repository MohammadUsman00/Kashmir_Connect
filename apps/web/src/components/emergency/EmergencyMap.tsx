"use client";

import * as React from "react";
import mapboxgl, { type LngLatLike } from "mapbox-gl";
import { KCCard, KCButton } from "@kashmir/ui";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type FacilityType = "HOSPITAL" | "POLICE" | "AMBULANCE" | "FIRE";
type Facility = {
  id: string;
  type: FacilityType;
  name: string;
  phone: string;
  etaMin: number;
  distanceKm: number;
  coords: [number, number];
};

const facilitySeed: Facility[] = [
  { id: "h1", type: "HOSPITAL", name: "SMHS Hospital Srinagar", phone: "102", etaMin: 12, distanceKm: 4.2, coords: [74.807, 34.09] },
  { id: "h2", type: "HOSPITAL", name: "SKIMS Soura", phone: "102", etaMin: 20, distanceKm: 8.8, coords: [74.824, 34.142] },
  { id: "h3", type: "HOSPITAL", name: "District Hospital Anantnag", phone: "102", etaMin: 55, distanceKm: 43.5, coords: [75.15, 33.73] },
  { id: "p1", type: "POLICE", name: "Police Control Room Srinagar", phone: "100", etaMin: 10, distanceKm: 3.4, coords: [74.801, 34.101] },
  { id: "p2", type: "POLICE", name: "Kothibagh Police Station", phone: "100", etaMin: 14, distanceKm: 4.9, coords: [74.812, 34.083] },
  { id: "p3", type: "POLICE", name: "Gulmarg Police Station", phone: "100", etaMin: 62, distanceKm: 49.4, coords: [74.38, 34.05] },
  { id: "a1", type: "AMBULANCE", name: "108 Ambulance Depot Srinagar", phone: "108", etaMin: 9, distanceKm: 2.8, coords: [74.796, 34.079] },
  { id: "a2", type: "AMBULANCE", name: "Ambulance Base Baramulla", phone: "108", etaMin: 48, distanceKm: 37.4, coords: [74.37, 34.2] },
  { id: "a3", type: "AMBULANCE", name: "Ambulance Base Pulwama", phone: "108", etaMin: 34, distanceKm: 28.1, coords: [74.89, 33.88] },
  { id: "f1", type: "FIRE", name: "Fire Station Lal Chowk", phone: "101", etaMin: 11, distanceKm: 3.7, coords: [74.808, 34.072] },
  { id: "f2", type: "FIRE", name: "Fire Station Baramulla", phone: "101", etaMin: 44, distanceKm: 35.9, coords: [74.36, 34.2] },
  { id: "f3", type: "FIRE", name: "Fire Station Anantnag", phone: "101", etaMin: 51, distanceKm: 41.3, coords: [75.15, 33.74] }
];

function facilityEmoji(type: FacilityType): string {
  if (type === "HOSPITAL") return "✚";
  if (type === "POLICE") return "🛡️";
  if (type === "AMBULANCE") return "🚑";
  return "🔥";
}

function facilityColor(type: FacilityType): string {
  if (type === "HOSPITAL") return "#C0392B";
  if (type === "POLICE") return "#1B6CA8";
  if (type === "AMBULANCE") return "#D97706";
  return "#EAB308";
}

export function EmergencyMap({
  activeSOS
}: {
  activeSOS: { lat: number; lng: number; caseNumber: string } | null;
}): JSX.Element {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const [userPosition, setUserPosition] = React.useState<[number, number] | null>(null);
  const [nearest, setNearest] = React.useState<Facility[]>([]);

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [74.7973, 34.0837] as LngLatLike,
      zoom: 10
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    return () => map.remove();
  }, []);

  React.useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setUserPosition(coords);
      },
      () => setUserPosition([74.7973, 34.0837]),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;

    new mapboxgl.Marker({ color: "#DC2626" })
      .setLngLat(userPosition)
      .setPopup(new mapboxgl.Popup().setHTML("<strong>You</strong><br/>Current location"))
      .addTo(map);

    map.flyTo({ center: userPosition, zoom: 11 });

    const sorted = [...facilitySeed].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 8);
    setNearest(sorted);
    for (const facility of sorted) {
      const markerEl = document.createElement("div");
      markerEl.style.width = "28px";
      markerEl.style.height = "28px";
      markerEl.style.borderRadius = "999px";
      markerEl.style.display = "grid";
      markerEl.style.placeItems = "center";
      markerEl.style.color = "#fff";
      markerEl.style.fontSize = "14px";
      markerEl.style.fontWeight = "700";
      markerEl.style.background = facilityColor(facility.type);
      markerEl.textContent = facilityEmoji(facility.type);

      new mapboxgl.Marker({ element: markerEl })
        .setLngLat(facility.coords)
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${facility.name}</strong><br/>Phone: ${facility.phone}<br/>Distance: ${facility.distanceKm} km<br/>ETA: ${facility.etaMin} mins`
          )
        )
        .addTo(map);
    }
  }, [userPosition]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeSOS) return;
    map.flyTo({ center: [activeSOS.lng, activeSOS.lat], zoom: 12 });

    const nearestHospital = [...facilitySeed]
      .filter((f) => f.type === "HOSPITAL")
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    if (!nearestHospital) return;

    const routeGeoJson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [activeSOS.lng, activeSOS.lat],
              [nearestHospital.coords[0], nearestHospital.coords[1]]
            ]
          }
        }
      ]
    };

    if (!map.getSource("sos-route")) {
      map.addSource("sos-route", { type: "geojson", data: routeGeoJson });
      map.addLayer({
        id: "sos-route-layer",
        type: "line",
        source: "sos-route",
        paint: {
          "line-color": "#DC2626",
          "line-width": 5,
          "line-opacity": 0.85
        }
      });
    } else {
      const source = map.getSource("sos-route") as mapboxgl.GeoJSONSource;
      source.setData(routeGeoJson);
    }
  }, [activeSOS]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="h-[460px] overflow-hidden rounded-2xl border border-[#e4d6c2] dark:border-[#1f334d]">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      <KCCard className="space-y-3">
        <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Nearest Emergency Services</h3>
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {nearest.map((facility) => (
            <div key={facility.id} className="rounded-xl border border-[#e7dac7] bg-[#fcf7ef] p-3 dark:border-[#243954] dark:bg-[#132238]">
              <p className="text-sm font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">
                {facilityEmoji(facility.type)} {facility.name}
              </p>
              <p className="text-xs text-[#695448] dark:text-[#bdcee4]">
                {facility.distanceKm} km • ETA {facility.etaMin} mins • {facility.phone}
              </p>
              <a href={`tel:${facility.phone}`}>
                <KCButton size="sm" className="mt-2">
                  Call Now
                </KCButton>
              </a>
            </div>
          ))}
        </div>
      </KCCard>
    </div>
  );
}
