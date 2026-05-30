import { NextResponse } from "next/server";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";

export const runtime = "nodejs";

const defaultGroups = [
  { slug: "nit-srinagar", name: "NIT Srinagar" },
  { slug: "skuast-kashmir", name: "SKUAST Kashmir" },
  { slug: "bgsbu-rajouri", name: "BGSBU Rajouri" },
  { slug: "university-of-kashmir", name: "University of Kashmir" },
  { slug: "gmc-srinagar", name: "Government Medical College Srinagar" },
  { slug: "iust", name: "Islamic University of Science and Technology" }
];

async function ensureDefaultGroups(): Promise<void> {
  for (const group of defaultGroups) {
    await prisma.collegeGroup.upsert({
      where: { slug: group.slug },
      update: {},
      create: group
    });
  }
}

export async function GET(): Promise<Response> {
  try {
    await ensureDefaultGroups();
    const groups = await prisma.collegeGroup.findMany({
      include: {
        _count: { select: { members: true, announcements: true } },
        members: {
          include: {
            user: { select: { email: true } }
          },
          take: 20
        },
        announcements: {
          orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
          take: 6
        }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as
      | { action: "join" | "leave"; groupId: string }
      | { action: "announce"; groupId: string; title: string; body: string; pinned?: boolean };

    if (body.action === "join") {
      await prisma.collegeGroupMember.upsert({
        where: { groupId_userId: { groupId: body.groupId, userId: session.user.id } },
        update: {},
        create: { groupId: body.groupId, userId: session.user.id }
      });
      return NextResponse.json({ success: true });
    }
    if (body.action === "leave") {
      await prisma.collegeGroupMember.delete({
        where: { groupId_userId: { groupId: body.groupId, userId: session.user.id } }
      }).catch(() => undefined);
      return NextResponse.json({ success: true });
    }

    const announcement = await prisma.groupAnnouncement.create({
      data: {
        groupId: body.groupId,
        authorId: session.user.id,
        title: body.title,
        body: body.body,
        pinned: Boolean(body.pinned)
      }
    });
    return NextResponse.json({ announcement });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed group action" }, { status: 500 });
  }
}
