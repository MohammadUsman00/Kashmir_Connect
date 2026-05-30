"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AlertBanner } from "@/components/emergency/AlertBanner";
import { SOSButton } from "@/components/emergency/SOSButton";

const EmergencyMap = dynamic(
  () => import("@/components/emergency/EmergencyMap").then((module) => module.EmergencyMap),
  { ssr: false }
);

export default function EmergencyPage(): JSX.Element {
  const [activeSOS, setActiveSOS] = React.useState<{ caseNumber: string; lat: number; lng: number; timestamp: string } | null>(null);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[#3D1F0D] dark:text-[#f3dfbb]">Emergency Response Network</h1>
        <p className="text-sm text-[#6b5548] dark:text-[#baccdf]">
          Real-time SOS activation, district alerts, nearest emergency routing, and offline-safe failover.
        </p>
      </div>

      <AlertBanner />

      <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <SOSButton onActivated={setActiveSOS} />
        <EmergencyMap activeSOS={activeSOS} />
      </section>
    </main>
  );
}
