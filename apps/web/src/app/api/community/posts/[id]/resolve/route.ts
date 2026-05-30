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

    const post = await prisma.post.findUnique({
      where: { id },
      include: { lostFound: true }
    });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.update({
      where: { id },
      data: { resolved: true }
    });
    if (post.lostFound) {
      await prisma.lostFoundItem.update({
        where: { postId: id },
        data: { resolved: true }
      });
    }

    const io = getEmergencySocketServer();
    io?.emit("community:post:resolved", { postId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to resolve post" }, { status: 500 });
  }
}
