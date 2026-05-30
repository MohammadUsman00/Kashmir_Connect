import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    transport: "websocket",
    path: "/api/socket.io",
    room: "analytics-feed",
    event: "analytics:event"
  });
}
