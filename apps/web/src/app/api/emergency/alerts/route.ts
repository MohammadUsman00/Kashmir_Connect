import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getEmergencySocketServer, type AlertPayload } from "@/lib/emergency/socket";

export const runtime = "nodejs";

const redis = Redis.fromEnv();

type AlertType = "FLOOD" | "SNOWFALL" | "LANDSLIDE" | "EARTHQUAKE" | "FIRE" | "CURFEW";
type AlertSeverity = "CRITICAL" | "WARNING" | "ADVISORY";

function alertId(): string {
  return `ALT-${Date.now().toString(36).toUpperCase()}`;
}

const defaultAlerts: AlertPayload[] = [
  {
    id: "ALT-SEED-1",
    district: "Srinagar",
    type: "SNOWFALL",
    severity: "ADVISORY",
    title: "Light snowfall advisory",
    message: "Light snowfall expected in upper reaches in the next 24 hours. Drive with caution.",
    createdAt: new Date().toISOString()
  }
];

export async function GET(): Promise<Response> {
  try {
    const ids = (await redis.lrange<string[]>("alerts:history", 0, 100)) ?? [];
    const alerts: AlertPayload[] = [];
    for (const id of ids) {
      const payload = await redis.get<AlertPayload>(`alert:${id}`);
      if (payload) alerts.push(payload);
    }

    return NextResponse.json({ alerts: alerts.length ? alerts : defaultAlerts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = (await request.json()) as {
      district: string;
      type: AlertType;
      severity: AlertSeverity;
      title: string;
      message: string;
    };

    if (!body?.district || !body?.type || !body?.severity || !body?.title || !body?.message) {
      return NextResponse.json({ error: "Missing required alert fields" }, { status: 400 });
    }

    const payload: AlertPayload = {
      id: alertId(),
      district: body.district,
      type: body.type,
      severity: body.severity,
      title: body.title,
      message: body.message,
      createdAt: new Date().toISOString()
    };

    await redis.set(`alert:${payload.id}`, payload, { ex: 60 * 60 * 24 * 30 });
    await redis.lpush("alerts:history", payload.id);
    await redis.ltrim("alerts:history", 0, 499);

    const io = getEmergencySocketServer();
    io?.emit("alert:new", payload);
    io?.to(`district-${payload.district}`).emit("alert:new", payload);

    return NextResponse.json({ success: true, alert: payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to publish alert" },
      { status: 500 }
    );
  }
}
