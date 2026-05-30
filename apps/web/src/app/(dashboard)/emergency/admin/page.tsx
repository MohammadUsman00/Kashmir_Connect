"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KCCard, KCButton } from "@kashmir/ui";
import { getEmergencyClientSocket, type SOSEventPayload } from "@/lib/emergency/socket";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type AlertType = "FLOOD" | "SNOWFALL" | "LANDSLIDE" | "EARTHQUAKE" | "FIRE" | "CURFEW";
type AlertSeverity = "CRITICAL" | "WARNING" | "ADVISORY";

export default function EmergencyAdminPage(): JSX.Element {
  const [incidents, setIncidents] = React.useState<SOSEventPayload[]>([]);
  const [district, setDistrict] = React.useState("Srinagar");
  const [type, setType] = React.useState<AlertType>("FLOOD");
  const [severity, setSeverity] = React.useState<AlertSeverity>("WARNING");
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const mapNodeRef = React.useRef<HTMLDivElement | null>(null);
  const markersRef = React.useRef<mapboxgl.Marker[]>([]);

  const loadIncidents = React.useCallback(async () => {
    const response = await fetch("/api/sos");
    if (!response.ok) return;
    const data = (await response.json()) as { incidents: SOSEventPayload[] };
    setIncidents(data.incidents ?? []);
  }, []);

  React.useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  React.useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [74.7973, 34.0837],
      zoom: 7.7
    });
    return () => mapRef.current?.remove();
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const marker of markersRef.current) marker.remove();
    markersRef.current = incidents.map((incident) => {
      const marker = new mapboxgl.Marker({ color: incident.status === "ACTIVE" ? "#DC2626" : "#10B981" })
        .setLngLat([incident.lng, incident.lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${incident.id}</strong><br/>${incident.name}<br/>${incident.type}<br/>${incident.status}`
          )
        )
        .addTo(map);
      return marker;
    });
  }, [incidents]);

  React.useEffect(() => {
    const socket = getEmergencyClientSocket();
    socket.emit("join:admin");
    socket.on("sos:new", (payload: SOSEventPayload) => {
      setIncidents((prev) => [payload, ...prev]);
    });
    socket.on("sos:resolved", (payload: { id: string }) => {
      setIncidents((prev) => prev.map((item) => (item.id === payload.id ? { ...item, status: "RESOLVED" } : item)));
    });
    return () => {
      socket.off("sos:new");
      socket.off("sos:resolved");
    };
  }, []);

  const onResolve = async (id: string) => {
    const response = await fetch("/api/sos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (!response.ok) return;
    setIncidents((prev) => prev.map((item) => (item.id === id ? { ...item, status: "RESOLVED" } : item)));
  };

  const onBroadcastAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/emergency/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, type, severity, title, message })
      });
      setTitle("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  const districtAnalytics = React.useMemo(() => {
    const districtCount = incidents.reduce<Record<string, number>>((acc, item) => {
      acc[item.district] = (acc[item.district] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(districtCount).map(([districtKey, count]) => ({ district: districtKey, incidents: count }));
  }, [incidents]);

  const typeAnalytics = React.useMemo(() => {
    const typeCount = incidents.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(typeCount).map(([typeKey, count]) => ({ type: typeKey, incidents: count }));
  }, [incidents]);

  const timeOfDayAnalytics = React.useMemo(() => {
    const buckets = { Night: 0, Morning: 0, Afternoon: 0, Evening: 0 };
    for (const incident of incidents) {
      const hour = new Date(incident.timestamp).getHours();
      if (hour < 6) buckets.Night += 1;
      else if (hour < 12) buckets.Morning += 1;
      else if (hour < 18) buckets.Afternoon += 1;
      else buckets.Evening += 1;
    }
    return Object.entries(buckets).map(([slot, incidentsCount]) => ({ slot, incidents: incidentsCount }));
  }, [incidents]);

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#3D1F0D] dark:text-[#f3dfbb]">Emergency Admin Dashboard</h1>
        <p className="text-sm text-[#6b5548] dark:text-[#baccdf]">
          Live SOS operations, district-wide alerts, and response analytics.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <KCCard className="space-y-3">
          <h2 className="text-lg font-semibold">Active SOS Events</h2>
          <div className="max-h-[360px] space-y-2 overflow-y-auto">
            {incidents.map((incident) => (
              <div key={incident.id} className="rounded-xl border border-[#e5d8c5] bg-[#fffaf3] p-3 text-sm dark:border-[#243a55] dark:bg-[#102137]">
                <p className="font-semibold">
                  {incident.id} • {incident.name}
                </p>
                <p>
                  {incident.type} • {incident.district} • {incident.status}
                </p>
                <p>
                  {incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}
                </p>
                {incident.status === "ACTIVE" ? (
                  <KCButton size="sm" className="mt-2" onClick={() => void onResolve(incident.id)}>
                    Mark Resolved
                  </KCButton>
                ) : null}
              </div>
            ))}
          </div>
        </KCCard>

        <KCCard className="space-y-3">
          <h2 className="text-lg font-semibold">Broadcast Alert</h2>
          <form className="space-y-2" onSubmit={onBroadcastAlert}>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} className="h-10 w-full rounded-lg border px-3 dark:bg-[#102137]" />
            <select value={type} onChange={(e) => setType(e.target.value as AlertType)} className="h-10 w-full rounded-lg border px-3 dark:bg-[#102137]">
              {["FLOOD", "SNOWFALL", "LANDSLIDE", "EARTHQUAKE", "FIRE", "CURFEW"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity)} className="h-10 w-full rounded-lg border px-3 dark:bg-[#102137]">
              {["CRITICAL", "WARNING", "ADVISORY"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Alert title" className="h-10 w-full rounded-lg border px-3 dark:bg-[#102137]" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Alert message" className="w-full rounded-lg border px-3 py-2 dark:bg-[#102137]" />
            <KCButton type="submit" loading={submitting}>
              Send Alert
            </KCButton>
          </form>
        </KCCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <KCCard className="space-y-3">
          <h2 className="text-lg font-semibold">Live SOS Map</h2>
          <div ref={mapNodeRef} className="h-[360px] rounded-xl border border-[#e4d7c4] dark:border-[#213650]" />
        </KCCard>
        <div className="space-y-4">
          <KCCard className="space-y-3">
            <h2 className="text-lg font-semibold">Incidents by District</h2>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="district" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="incidents" fill="#C0392B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </KCCard>
          <KCCard className="space-y-3">
            <h2 className="text-lg font-semibold">Incidents by Type</h2>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="incidents" fill="#1B6CA8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </KCCard>
          <KCCard className="space-y-3">
            <h2 className="text-lg font-semibold">Incidents by Time of Day</h2>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDayAnalytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="slot" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="incidents" fill="#D97706" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </KCCard>
        </div>
      </section>
    </main>
  );
}
