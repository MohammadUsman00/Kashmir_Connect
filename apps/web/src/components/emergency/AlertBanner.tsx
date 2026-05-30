"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KCCard, KCButton } from "@kashmir/ui";
import { getEmergencyClientSocket } from "@/lib/emergency/socket";

type Alert = {
  id: string;
  district: string;
  type: "FLOOD" | "SNOWFALL" | "LANDSLIDE" | "EARTHQUAKE" | "FIRE" | "CURFEW";
  severity: "CRITICAL" | "WARNING" | "ADVISORY";
  title: string;
  message: string;
  createdAt: string;
};

function severityStyle(severity: Alert["severity"]): string {
  if (severity === "CRITICAL") return "border-[#b91c1c] bg-[#fee2e2] text-[#7f1d1d] dark:border-[#ef4444] dark:bg-[#3f1111] dark:text-[#fecaca]";
  if (severity === "WARNING") return "border-[#ea580c] bg-[#ffedd5] text-[#9a3412] dark:border-[#fb923c] dark:bg-[#42210f] dark:text-[#fed7aa]";
  return "border-[#ca8a04] bg-[#fef9c3] text-[#854d0e] dark:border-[#facc15] dark:bg-[#3a320f] dark:text-[#fde68a]";
}

export function AlertBanner(): JSX.Element {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [dismissed, setDismissed] = React.useState<Record<string, true>>({});

  const fetchAlerts = React.useCallback(async () => {
    const response = await fetch("/api/emergency/alerts");
    if (!response.ok) return;
    const data = (await response.json()) as { alerts: Alert[] };
    setAlerts(data.alerts ?? []);
  }, []);

  React.useEffect(() => {
    void fetchAlerts();
    const id = window.setInterval(() => void fetchAlerts(), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [fetchAlerts]);

  React.useEffect(() => {
    const socket = getEmergencyClientSocket();
    socket.on("alert:new", (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Emergency Alert: ${alert.type}`, {
          body: alert.message
        });
      }
    });
    return () => {
      socket.off("alert:new");
    };
  }, []);

  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    const subscribePush = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      const key = Uint8Array.from(atob(vapidKey.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key
      });
    };
    void subscribePush();
  }, []);

  const active = alerts.filter((alert) => !(dismissed[alert.id] && alert.severity !== "CRITICAL"));

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {active.slice(0, 2).map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-xl border p-3 ${severityStyle(alert.severity)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {alert.type} • {alert.district}
                </p>
                <p className="text-sm">{alert.title}</p>
                <p className="text-xs opacity-90">{alert.message}</p>
              </div>
              {alert.severity !== "CRITICAL" ? (
                <button
                  className="rounded-md px-2 py-1 text-xs underline"
                  onClick={() => setDismissed((prev) => ({ ...prev, [alert.id]: true }))}
                >
                  Dismiss
                </button>
              ) : null}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <KCCard className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#3D1F0D] dark:text-[#f1deb7]">Alert History</p>
          <KCButton size="sm" variant="ghost" onClick={() => setShowHistory((prev) => !prev)}>
            {showHistory ? "Hide" : "Show"}
          </KCButton>
        </div>
        {showHistory ? (
          <div className="max-h-44 space-y-2 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={`${alert.id}-history`} className={`rounded-lg border p-2 text-xs ${severityStyle(alert.severity)}`}>
                <p className="font-semibold">
                  {alert.type} • {alert.district}
                </p>
                <p>{alert.message}</p>
                <p>{new Date(alert.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : null}
      </KCCard>
    </div>
  );
}
