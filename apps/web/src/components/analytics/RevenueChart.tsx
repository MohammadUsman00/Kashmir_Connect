"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KCCard, KCSkeleton } from "@kashmir/ui";

type Point = { day: string; value: number };

export function RevenueChart({
  title,
  data,
  loading = false,
  color = "#1B6CA8"
}: {
  title: string;
  data: Point[];
  loading?: boolean;
  color?: string;
}): JSX.Element {
  return (
    <KCCard className="space-y-3">
      <h3 className="text-lg font-semibold text-[#3D1F0D] dark:text-[#f2dfbb]">{title}</h3>
      {loading ? (
        <KCSkeleton className="h-72 w-full rounded-xl" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="rev-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,140,140,0.25)" />
              <XAxis dataKey="day" tick={{ fill: "currentColor", fontSize: 12 }} />
              <YAxis tick={{ fill: "currentColor", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(16,23,38,0.95)",
                  border: "1px solid rgba(120,140,170,0.4)",
                  borderRadius: "10px",
                  color: "#fff"
                }}
              />
              <Area type="monotone" dataKey="value" stroke={color} fill="url(#rev-gradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </KCCard>
  );
}
