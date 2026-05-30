"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis
} from "recharts";
import { KCCard, KCSkeleton, KCStatCard } from "@kashmir/ui";
import { DistrictMap, type DistrictMetric } from "@/components/analytics/DistrictMap";
import { TourismFlowChart } from "@/components/analytics/TourismFlowChart";
import { LiveFeed } from "@/components/analytics/LiveFeed";

type PlatformPayload = {
  kpis: {
    totalStorefronts: number;
    activeStorefronts: number;
    inactiveStorefronts: number;
    productsCount: number;
    totalOrders: number;
    totalOrderValue: number;
    signupsThisWeek: number;
    advisorQueries: number;
    activeUsersToday: number;
  };
  growth: Array<{ day: string; storefronts: number }>;
  sectorDistribution: Array<{ name: string; value: number }>;
  districtMetrics: DistrictMetric[];
  dailyActiveUsers: Array<{ day: string; users: number }>;
  topStorefronts: Array<{ storefrontId: string; name?: string; slug?: string; verified?: boolean; views: number }>;
  badgeMetrics: {
    approved: number;
    pending: number;
    rejected: number;
    approvalRate: number;
    avgReviewHours: number;
  };
};

const treemapColors = ["#1B6CA8", "#3D1F0D", "#C8972A", "#C0392B", "#7A9E7E", "#6A4C93"];

export default function AdminAnalyticsPage(): JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState<"merchant" | "tourist" | "emergency">("merchant");
  const [payload, setPayload] = React.useState<PlatformPayload | null>(null);

  React.useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const response = await fetch("/api/analytics/admin?preset=30d", { cache: "no-store" });
      const data = (await response.json()) as PlatformPayload;
      if (active) setPayload(data);
      if (active) setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3D1F0D] dark:text-[#f2dfbb]">Admin Platform Analytics</h1>
        <p className="text-sm text-[#6f5a4d] dark:text-[#9cb6d0]">Platform scale, growth, quality and real-time risk intelligence.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {loading || !payload ? (
          Array.from({ length: 6 }).map((_, idx) => <KCSkeleton key={idx} className="h-28 w-full rounded-xl" />)
        ) : (
          <>
            <KCStatCard label={`${payload.kpis.activeStorefronts} active / ${payload.kpis.inactiveStorefronts} inactive`} value={payload.kpis.totalStorefronts} />
            <KCStatCard label="Products listed (catalog size)" value={payload.kpis.productsCount} />
            <KCStatCard label={`Total order value ₹${payload.kpis.totalOrderValue.toLocaleString("en-IN")}`} value={payload.kpis.totalOrders} />
            <KCStatCard label="Signups this week" value={payload.kpis.signupsThisWeek} />
            <KCStatCard label="AI advisor queries used" value={payload.kpis.advisorQueries} />
            <KCStatCard label="Active users today (HLL)" value={payload.kpis.activeUsersToday} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KCCard className="space-y-2">
          <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Storefront growth</h3>
          {loading ? (
            <KCSkeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payload?.growth ?? []}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="storefronts" stroke="#1B6CA8" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </KCCard>

        <KCCard className="space-y-2">
          <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Sector distribution</h3>
          {loading ? (
            <KCSkeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap data={payload?.sectorDistribution ?? []} dataKey="value" stroke="#fff" fill="#1B6CA8">
                  {(payload?.sectorDistribution ?? []).map((_, index) => (
                    <Cell key={index} fill={treemapColors[index % treemapColors.length]} />
                  ))}
                </Treemap>
              </ResponsiveContainer>
            </div>
          )}
        </KCCard>
      </div>

      <DistrictMap data={payload?.districtMetrics ?? []} mode={mode} onModeChange={setMode} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <KCCard className="space-y-2">
          <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Daily active users (30 days)</h3>
          {loading ? (
            <KCSkeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payload?.dailyActiveUsers ?? []}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#C8972A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </KCCard>

        <KCCard className="space-y-3">
          <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Top 10 storefronts by views</h3>
          {loading ? (
            <KCSkeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <div className="space-y-2">
              {(payload?.topStorefronts ?? []).map((store, idx) => (
                <div key={store.storefrontId} className="flex items-center justify-between rounded-lg border border-[#e6d8c4] bg-[#fffaf3] px-3 py-2 text-sm dark:border-[#26405f] dark:bg-[#10233a]">
                  <span>
                    #{idx + 1} {store.name ?? "Unnamed Store"} {store.verified ? "✔" : ""}
                  </span>
                  <span className="font-semibold">{store.views.toLocaleString()} views</span>
                </div>
              ))}
            </div>
          )}
        </KCCard>
      </div>

      <KCCard className="space-y-2">
        <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Badge approval and review latency</h3>
        {loading || !payload ? (
          <KCSkeleton className="h-28 w-full rounded-xl" />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[#e8dbc9] bg-[#fffaf3] p-3 dark:border-[#26405f] dark:bg-[#10233a]">
              <p className="text-xs text-[#7b6654] dark:text-[#9fbbd9]">Approval rate</p>
              <p className="text-2xl font-bold">{payload.badgeMetrics.approvalRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-[#e8dbc9] bg-[#fffaf3] p-3 dark:border-[#26405f] dark:bg-[#10233a]">
              <p className="text-xs text-[#7b6654] dark:text-[#9fbbd9]">Average review time</p>
              <p className="text-2xl font-bold">{payload.badgeMetrics.avgReviewHours.toFixed(1)}h</p>
            </div>
            <div className="rounded-xl border border-[#e8dbc9] bg-[#fffaf3] p-3 dark:border-[#26405f] dark:bg-[#10233a]">
              <p className="text-xs text-[#7b6654] dark:text-[#9fbbd9]">Approved / Pending / Rejected</p>
              <p className="text-2xl font-bold">
                {payload.badgeMetrics.approved}/{payload.badgeMetrics.pending}/{payload.badgeMetrics.rejected}
              </p>
            </div>
          </div>
        )}
      </KCCard>

      <TourismFlowChart />
      <LiveFeed />
    </div>
  );
}
