import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";
import { getEmergencySocketServer, type SOSEventPayload } from "@/lib/emergency/socket";
import { sendEmergencySMS } from "@/lib/emergency/sms";
import { withSOSTransaction } from "@/instrumentation";
import { trackPosthogEvent } from "@/lib/monitoring/posthog";

export const runtime = "nodejs";

const redis = Redis.fromEnv();

type SOSRequestBody = {
  lat: number;
  lng: number;
  district?: string;
  type?: "MEDICAL" | "POLICE" | "FIRE" | "GENERAL";
  timestamp: string;
  deviceInfo?: string;
  offlineQueued?: boolean;
};

function caseId(): string {
  return `SOS-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(request: Request): Promise<Response> {
  return withSOSTransaction(async () => {
    try {
    const body = (await request.json()) as SOSRequestBody;
    const session = await auth();
    const userId = session?.user?.id ?? "anonymous";
    const userName = session?.user?.email?.split("@")[0] ?? "User";

    if (typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
    }

    const id = caseId();
    const district = body.district ?? "srinagar";
    const type = body.type ?? "GENERAL";
    const payload: SOSEventPayload = {
      id,
      userId,
      name: userName,
      district,
      type,
      lat: body.lat,
      lng: body.lng,
      timestamp: body.timestamp ?? new Date().toISOString(),
      status: "ACTIVE"
    };

    await redis.set(`sos:${id}`, payload, { ex: 60 * 60 * 24 * 7 });
    await redis.lpush("sos:active", id);
    await redis.ltrim("sos:active", 0, 999);

    const mapsLink = `https://maps.google.com/?q=${payload.lat},${payload.lng}`;
    const profile = userId !== "anonymous"
      ? await prisma.user.findUnique({ where: { id: userId }, select: { profile: true } })
      : null;
    const profileObj = (profile?.profile ?? {}) as Record<string, unknown>;
    const emergencyContacts = Array.isArray(profileObj.emergencyContacts)
      ? (profileObj.emergencyContacts as Array<{ name?: string; phone?: string }>)
          .filter((entry) => entry.phone)
          .slice(0, 3)
          .map((entry) => ({ name: entry.name ?? "Contact", phone: entry.phone ?? "" }))
      : [];

    const nearestPolicePhone = "+91100";
    const smsResult = await sendEmergencySMS({
      userName,
      locationLabel: `${payload.lat.toFixed(5)}, ${payload.lng.toFixed(5)}`,
      mapsLink,
      timestamp: payload.timestamp,
      emergencyContacts,
      nearestPolicePhone
    });

    const io = getEmergencySocketServer();
    io?.to("admin-dashboard").emit("sos:new", payload);
    io?.to(`district-${district}`).emit("sos:new", payload);
    io?.to(`emergency-${type}`).emit("sos:new", payload);
    if (userId !== "anonymous") {
      await trackPosthogEvent(userId, "sos_triggered", { district, type, offlineQueued: Boolean(body.offlineQueued) });
    }

    return NextResponse.json({
      success: true,
      caseNumber: id,
      payload,
      sms: smsResult,
      offlineQueued: Boolean(body.offlineQueued),
      emergencyNumbers: {
        allInOne: "112",
        police: "100",
        fire: "101",
        ambulance: "102",
        emergencyMedicalTransport: "108",
        womenHelpline: "1091",
        disasterControlJK: "1070"
      }
    });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "SOS activation failed" },
        { status: 500 }
      );
    }
  });
}

export async function GET(): Promise<Response> {
  try {
    const ids = (await redis.lrange<string[]>("sos:active", 0, 500)) ?? [];
    const incidents: SOSEventPayload[] = [];
    for (const id of ids) {
      const payload = await redis.get<SOSEventPayload>(`sos:${id}`);
      if (payload?.status === "ACTIVE") incidents.push(payload);
    }
    return NextResponse.json({ incidents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load SOS incidents" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (session?.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = (await request.json()) as { id: string };
    if (!body?.id) return NextResponse.json({ error: "SOS id required" }, { status: 400 });

    const existing = await redis.get<SOSEventPayload>(`sos:${body.id}`);
    if (!existing) return NextResponse.json({ error: "SOS not found" }, { status: 404 });

    const resolvedAt = new Date().toISOString();
    const responseTimeSec = Math.max(0, Math.floor((Date.now() - new Date(existing.timestamp).getTime()) / 1000));
    const nextPayload: SOSEventPayload = { ...existing, status: "RESOLVED" };
    await redis.set(`sos:${body.id}`, nextPayload, { ex: 60 * 60 * 24 * 7 });

    const io = getEmergencySocketServer();
    io?.to("admin-dashboard").emit("sos:resolved", { id: body.id, resolvedAt, responseTimeSec });
    io?.emit("sos:resolved", { id: body.id, resolvedAt, responseTimeSec });

    return NextResponse.json({ success: true, id: body.id, resolvedAt, responseTimeSec });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve SOS" },
      { status: 500 }
    );
  }
}
