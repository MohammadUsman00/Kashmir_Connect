import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getPlatformAnalytics } from "@/lib/analytics/aggregations";
import { getEmergencySocketServer } from "@/lib/emergency/socket";

function resolveRange(req: NextRequest): { from: Date; to: Date } {
  const now = new Date();
  const preset = req.nextUrl.searchParams.get("preset") ?? "30d";
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  return { from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), to: now };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await getPlatformAnalytics(resolveRange(req));
  const io = getEmergencySocketServer();
  io?.to("analytics-feed").emit("analytics:event", {
    id: crypto.randomUUID(),
    type: "signup",
    label: "Admin analytics dashboard fetched",
    at: new Date().toISOString()
  });
  return NextResponse.json(data);
}
