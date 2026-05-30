"use client";

import React from "react";
import { HeatmapLayer as DeckHeatmapLayer } from "@deck.gl/aggregation-layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type mapboxgl from "mapbox-gl";

export type HeatPoint = {
  lng: number;
  lat: number;
  weight: number;
};

export function attachHeatmapLayer(
  map: mapboxgl.Map,
  id: string,
  points: HeatPoint[],
  colorRange: [number, number, number, number][] = [
    [33, 102, 172, 20],
    [33, 102, 172, 100],
    [33, 102, 172, 180],
    [200, 151, 42, 200],
    [192, 57, 43, 240]
  ]
): () => void {
  const overlay = new MapboxOverlay({
    interleaved: true,
    layers: [
      new DeckHeatmapLayer<HeatPoint>({
        id,
        data: points,
        getPosition: (d) => [d.lng, d.lat],
        getWeight: (d) => d.weight,
        radiusPixels: 40,
        intensity: 1,
        threshold: 0.03,
        colorRange
      })
    ]
  });
  map.addControl(overlay);
  return () => {
    map.removeControl(overlay);
  };
}
