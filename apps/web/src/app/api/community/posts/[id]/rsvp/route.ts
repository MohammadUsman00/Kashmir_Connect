import { NextResponse } from "next/server";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";
import { getEmergencySocketServer } from "@/lib/emergency/socket";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { postId: id }
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const existing = await prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: session.user.id } }
    });

    let rsvpCount = event.rsvpCount;
    if (existing) {
      await prisma.eventRsvp.delete({
        where: { eventId_userId: { eventId: event.id, userId: session.user.id } }
      });
      const updated = await prisma.event.update({
        where: { id: event.id },
        data: { rsvpCount: { decrement: 1 } },
        select: { rsvpCount: true }
      });
      rsvpCount = updated.rsvpCount;
    } else {
      await prisma.eventRsvp.create({
        data: { eventId: event.id, userId: session.user.id }
      });
      const updated = await prisma.event.update({
        where: { id: event.id },
        data: { rsvpCount: { increment: 1 } },
        select: { rsvpCount: true }
      });
      rsvpCount = updated.rsvpCount;
    }

    const io = getEmergencySocketServer();
    io?.emit("community:event:rsvp", { postId: id, rsvpCount });

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true, title: true }
    });
    if (post && post.authorId !== session.user.id) {
      const notification = await prisma.notification.create({
        data: {
          userId: post.authorId,
          title: "New RSVP on your event",
          body: `${session.user.email?.split("@")[0] ?? "A member"} responded to "${post.title}".`
        }
      });
      getEmergencySocketServer()?.to(`user-${post.authorId}`).emit("notification:new", notification);
    }

    return NextResponse.json({ postId: id, rsvpCount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed RSVP" }, { status: 500 });
  }
}
