import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getHourlyHeatmap, getStorefrontAnalytics } from "@/lib/analytics/aggregations";
import { getEmergencySocketServer } from "@/lib/emergency/socket";

function resolveRange(req: NextRequest): { from: Date; to: Date } {
  const now = new Date();
  const preset = req.nextUrl.searchParams.get("preset") ?? "30d";
  if (preset === "custom") {
    const fromRaw = req.nextUrl.searchParams.get("from");
    const toRaw = req.nextUrl.searchParams.get("to");
    if (fromRaw && toRaw) {
      return { from: new Date(fromRaw), to: new Date(toRaw) };
    }
  }
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  return { from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), to: now };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.storefrontId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = resolveRange(req);
  const [analytics, hourlyHeatmap] = await Promise.all([
    getStorefrontAnalytics(session.user.storefrontId, range),
    getHourlyHeatmap(session.user.storefrontId, 7)
  ]);

  const io = getEmergencySocketServer();
  io?.to("analytics-feed").emit("analytics:event", {
    id: crypto.randomUUID(),
    type: "storefront_view",
    label: `Storefront analytics refreshed for ${session.user.storefrontId}`,
    at: new Date().toISOString()
  });

  return NextResponse.json({ ...analytics, hourlyHeatmap });
}
