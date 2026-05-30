"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { KCButton, KCCard } from "@kashmir/ui";
import { getEmergencyClientSocket } from "@/lib/emergency/socket";

type SOSResult = {
  success: boolean;
  caseNumber: string;
  payload: { id: string; lat: number; lng: number; timestamp: string };
};

const HOLD_MS = 3000;

function getDeviceInfo(): string {
  return `${navigator.platform} | ${navigator.userAgent}`;
}

async function openSOSDB(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open("kc-emergency-db", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("sosQueue")) {
        db.createObjectStore("sosQueue", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueOfflineSOS(payload: Record<string, unknown>): Promise<void> {
  const db = await openSOSDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("sosQueue", "readwrite");
    tx.objectStore("sosQueue").put({ id: `queue-${Date.now()}`, payload, queuedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function registerEmergencySync(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const maybeSync = registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } };
  if (maybeSync.sync) {
    await maybeSync.sync.register("sos-sync");
  }
}

export function SOSButton({
  onActivated
}: {
  onActivated: (sos: { caseNumber: string; lat: number; lng: number; timestamp: string }) => void;
}): JSX.Element {
  const [holding, setHolding] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [activating, setActivating] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<SOSResult | null>(null);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const maybePeriodic = registration as ServiceWorkerRegistration & {
        periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
      };
      if (maybePeriodic.periodicSync) {
        await maybePeriodic.periodicSync.register("emergency-refresh-6h", {
          minInterval: 6 * 60 * 60 * 1000
        });
      }
    });
  }, []);

  const cancelHold = React.useCallback(() => {
    setHolding(false);
    setProgress(0);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const triggerSOS = React.useCallback(async () => {
    setActivating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 });
      });
      const payload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date().toISOString(),
        deviceInfo: getDeviceInfo(),
        district: "Srinagar",
        type: "GENERAL" as const
      };

      if (!navigator.onLine) {
        await enqueueOfflineSOS(payload);
        await registerEmergencySync();
        setConfirmation({
          success: true,
          caseNumber: `OFFLINE-${Date.now().toString(36).toUpperCase()}`,
          payload: { id: "queued", lat: payload.lat, lng: payload.lng, timestamp: payload.timestamp }
        });
        return;
      }

      const response = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("SOS API failed");
      const data = (await response.json()) as SOSResult;
      setConfirmation(data);
      onActivated({ caseNumber: data.caseNumber, lat: payload.lat, lng: payload.lng, timestamp: payload.timestamp });

      const socket = getEmergencyClientSocket();
      socket.emit("sos:new", data.payload);
    } catch {
      setConfirmation(null);
    } finally {
      setActivating(false);
      cancelHold();
    }
  }, [cancelHold, onActivated]);

  const startHold = () => {
    if (activating) return;
    setHolding(true);
    const startedAt = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(elapsed / HOLD_MS, 1);
      setProgress(ratio);
      if (ratio >= 1) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        void triggerSOS();
      }
    }, 16);
  };

  return (
    <KCCard className="space-y-4 border-[#f0c1bf] bg-[#fff1f0] dark:border-[#5f2520] dark:bg-[#2a1210]">
      <h3 className="text-lg font-semibold text-[#8b1f14] dark:text-[#ffb9b0]">Emergency SOS</h3>
      <p className="text-sm text-[#8b3b35] dark:text-[#f3b9b2]">
        Press and hold for 3 seconds to trigger emergency response and notify your contacts.
      </p>

      <div className="relative flex justify-center">
        <svg className="h-44 w-44">
          <circle cx="88" cy="88" r="76" strokeWidth="10" fill="none" className="stroke-[#f4c9c5] dark:stroke-[#4b1d1a]" />
          <motion.circle
            cx="88"
            cy="88"
            r="76"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            className="stroke-[#C0392B]"
            style={{
              strokeDasharray: 2 * Math.PI * 76,
              strokeDashoffset: (1 - progress) * 2 * Math.PI * 76
            }}
          />
        </svg>
        <button
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          className="absolute inset-0 m-auto h-28 w-28 rounded-full bg-[#C0392B] text-lg font-semibold text-white shadow-xl"
          disabled={activating}
        >
          {activating ? "Sending..." : "HOLD SOS"}
        </button>
      </div>

      {holding ? (
        <div className="flex items-center justify-center">
          <KCButton variant="ghost" onClick={cancelHold}>
            Cancel
          </KCButton>
        </div>
      ) : null}

      {confirmation ? (
        <div className="rounded-xl border border-[#f0b8b3] bg-white p-3 text-sm dark:border-[#5a2721] dark:bg-[#1a0f0e]">
          <p className="font-semibold text-[#8b1f14] dark:text-[#ffb9b0]">SOS Activated</p>
          <p>Case: {confirmation.caseNumber}</p>
          <p>Time: {new Date(confirmation.payload.timestamp).toLocaleString()}</p>
        </div>
      ) : null}
    </KCCard>
  );
}
