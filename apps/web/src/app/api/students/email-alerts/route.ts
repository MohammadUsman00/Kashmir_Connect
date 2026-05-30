import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const redis = Redis.fromEnv();

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      email: string;
      skills?: string[];
      location?: string;
      listingType?: "INTERNSHIP" | "JOB" | "ALL";
    };
    if (!body.email?.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const key = `students:alerts:${body.email.toLowerCase()}`;
    await redis.set(
      key,
      {
        email: body.email.toLowerCase(),
        skills: body.skills ?? [],
        location: body.location ?? "",
        listingType: body.listingType ?? "ALL",
        createdAt: new Date().toISOString()
      },
      { ex: 60 * 60 * 24 * 365 }
    );
    await redis.sadd("students:alerts:index", key);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed subscription" }, { status: 500 });
  }
}
