"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Cell,
  Funnel,
  FunnelChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { motion } from "framer-motion";
import { KCCard, KCSkeleton, KCStatCard } from "@kashmir/ui";
import { RevenueChart } from "@/components/analytics/RevenueChart";

type DatePreset = "7d" | "30d" | "90d" | "custom";

type MerchantPayload = {
  kpis: {
    views: number;
    viewChangePct: number;
    whatsappClicks: number;
    conversionRate: number;
    orders: number;
    productViews: number;
    topProduct: string;
    reviewScore: number;
  };
  dailyViews: Array<{ day: string; views: number }>;
  productPerformance: Array<{ productId: string; name: string; views: number }>;
  trafficSources: Array<{ name: string; value: number }>;
  ratingDistribution: Array<{ star: number; count: number }>;
  conversionFunnel: Array<{ stage: string; value: number }>;
  hourlyHeatmap: number[][];
};

const pieColors = ["#1B6CA8", "#3D1F0D", "#C8972A", "#C0392B"];

function DateRangeSelector({
  value,
  onChange
}: {
  value: DatePreset;
  onChange: (next: DatePreset) => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {(["7d", "30d", "90d", "custom"] as DatePreset[]).map((preset) => (
        <button
          key={preset}
          onClick={() => onChange(preset)}
          className={`rounded-full px-3 py-1 text-xs capitalize ${value === preset ? "bg-[#3D1F0D] text-white" : "bg-[#ebe0cf] text-[#3D1F0D] dark:bg-[#17304d] dark:text-[#f6e9cb]"}`}
        >
          {preset === "custom" ? "Custom" : preset.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function HourHeatmap({ matrix, loading }: { matrix: number[][]; loading: boolean }): JSX.Element {
  const ref = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    if (!ref.current || loading) return;
    const svg = ref.current;
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const maxValue = Math.max(1, ...matrix.flat());
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    matrix.forEach((row, day) => {
      row.forEach((value, hour) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(44 + hour * 22));
        rect.setAttribute("y", String(28 + day * 24));
        rect.setAttribute("width", "18");
        rect.setAttribute("height", "18");
        const alpha = 0.08 + (value / maxValue) * 0.92;
        rect.setAttribute("fill", `rgba(27,108,168,${alpha})`);
        rect.setAttribute("rx", "3");
        svg.appendChild(rect);
      });
      const dayText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      dayText.setAttribute("x", "6");
      dayText.setAttribute("y", String(42 + day * 24));
      dayText.setAttribute("font-size", "11");
      dayText.setAttribute("fill", "currentColor");
      dayText.textContent = dayLabels[day] ?? "";
      svg.appendChild(dayText);
    });
  }, [loading, matrix]);

  return (
    <KCCard className="space-y-2">
      <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Views by hour heatmap</h3>
      {loading ? (
        <KCSkeleton className="h-[220px] w-full rounded-xl" />
      ) : (
        <svg ref={ref} viewBox="0 0 580 220" className="h-[220px] w-full" />
      )}
    </KCCard>
  );
}

function exportCsv(payload: MerchantPayload | null): void {
  if (!payload) return;
  const rows = payload.dailyViews.map((item) => `${item.day},${item.views}`);
  const csv = ["day,views", ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "merchant-analytics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function MerchantAnalyticsPage(): JSX.Element {
  const [preset, setPreset] = React.useState<DatePreset>("30d");
  const [loading, setLoading] = React.useState(true);
  const [payload, setPayload] = React.useState<MerchantPayload | null>(null);
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");

  React.useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const query =
        preset === "custom" && customFrom && customTo
          ? `preset=custom&from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`
          : `preset=${preset}`;
      const response = await fetch(`/api/analytics/merchant?${query}`, { cache: "no-store" });
      const data = (await response.json()) as MerchantPayload;
      if (active) setPayload(data);
      if (active) setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [customFrom, customTo, preset]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#3D1F0D] dark:text-[#f2dfbb]">Merchant Analytics</h1>
          <p className="text-sm text-[#6d5948] dark:text-[#99b4d0]">Performance insights for storefront growth and conversion quality.</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector value={preset} onChange={setPreset} />
          {preset === "custom" ? (
            <>
              <input className="h-9 rounded-md border px-2 text-xs dark:bg-[#102239]" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <input className="h-9 rounded-md border px-2 text-xs dark:bg-[#102239]" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </>
          ) : null}
          <button className="rounded-md bg-[#1B6CA8] px-3 py-2 text-xs font-semibold text-white" onClick={() => exportCsv(payload)}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {loading || !payload ? (
          Array.from({ length: 5 }).map((_, idx) => <KCSkeleton key={idx} className="h-28 w-full rounded-xl" />)
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <KCStatCard label={`Storefront views (${payload.kpis.viewChangePct.toFixed(1)}% vs prev)`} value={payload.kpis.views} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <KCStatCard label={`WhatsApp clicks (${payload.kpis.conversionRate.toFixed(1)}% conversion)`} value={payload.kpis.whatsappClicks} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <KCStatCard label="Order requests (qualified leads)" value={payload.kpis.orders} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <KCStatCard label={`Product views (Top: ${payload.kpis.topProduct})`} value={payload.kpis.productViews} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <KCStatCard label="Review score (avg approved)" value={Number(payload.kpis.reviewScore.toFixed(2))} />
            </motion.div>
          </>
        )}
      </div>

      <RevenueChart
        title="Daily views"
        loading={loading}
        data={(payload?.dailyViews ?? []).map((item) => ({ day: item.day.slice(5), value: item.views }))}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <HourHeatmap matrix={payload?.hourlyHeatmap ?? Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))} loading={loading} />

        <KCCard className="space-y-2">
          <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Traffic sources</h3>
          {loading ? (
            <KCSkeleton className="h-[220px] w-full rounded-xl" />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={payload?.trafficSources ?? []} cx="50%" cy="50%" outerRadius={84}>
                    {(payload?.trafficSources ?? []).map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </KCCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KCCard className="space-y-2">
          <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Product performance</h3>
          {loading ? (
            <KCSkeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(payload?.productPerformance ?? []).slice(0, 8)} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#1B6CA8" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </KCCard>

        <KCCard className="space-y-2">
          <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Review rating distribution</h3>
          {loading ? (
            <KCSkeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payload?.ratingDistribution ?? []}>
                  <XAxis dataKey="star" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#C8972A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </KCCard>
      </div>

      <KCCard className="space-y-2">
        <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">Conversion funnel</h3>
        {loading ? (
          <KCSkeleton className="h-[240px] w-full rounded-xl" />
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={payload?.conversionFunnel ?? []} isAnimationActive />
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        )}
      </KCCard>
    </div>
  );
}
