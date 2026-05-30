import { NextResponse } from "next/server";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 80
    });
    const unread = notifications.filter((item) => !item.read).length;
    return NextResponse.json({ notifications, unread, userId: session.user.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed notifications fetch" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as { action: "markAllRead" | "setPrefs"; prefs?: Record<string, boolean> };

    if (body.action === "markAllRead") {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true }
      });
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: true }
    });
    const profile = (user?.profile ?? {}) as Record<string, unknown>;
    profile.notificationPreferences = body.prefs ?? {};
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profile }
    });
    return NextResponse.json({ success: true, prefs: profile.notificationPreferences });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update notifications" }, { status: 500 });
  }
}
