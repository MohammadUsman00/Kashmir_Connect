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

    const existingVote = await prisma.postVote.findUnique({
      where: { postId_userId: { postId: id, userId: session.user.id } }
    });

    let upvotes = 0;
    if (existingVote) {
      await prisma.postVote.delete({
        where: { postId_userId: { postId: id, userId: session.user.id } }
      });
      const updated = await prisma.post.update({
        where: { id },
        data: { upvotes: { decrement: 1 } },
        select: { upvotes: true, district: true, type: true, id: true }
      });
      upvotes = updated.upvotes;
      const io = getEmergencySocketServer();
      io?.emit("community:post:upvote", { postId: id, upvotes });
    } else {
      await prisma.postVote.create({
        data: { postId: id, userId: session.user.id }
      });
      const updated = await prisma.post.update({
        where: { id },
        data: { upvotes: { increment: 1 } },
        select: { upvotes: true, district: true, type: true, id: true }
      });
      upvotes = updated.upvotes;
      const io = getEmergencySocketServer();
      io?.emit("community:post:upvote", { postId: id, upvotes });

      const post = await prisma.post.findUnique({
        where: { id },
        select: { authorId: true, title: true }
      });
      if (post && post.authorId !== session.user.id) {
        const notification = await prisma.notification.create({
          data: {
            userId: post.authorId,
            title: "New upvote on your post",
            body: `${session.user.email?.split("@")[0] ?? "A member"} upvoted "${post.title}".`
          }
        });
        getEmergencySocketServer()?.to(`user-${post.authorId}`).emit("notification:new", notification);
      }
    }

    return NextResponse.json({ postId: id, upvotes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update upvote" }, { status: 500 });
  }
}
