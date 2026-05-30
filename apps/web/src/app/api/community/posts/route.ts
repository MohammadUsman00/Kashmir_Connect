import { NextResponse } from "next/server";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";
import { getEmergencySocketServer } from "@/lib/emergency/socket";

export const runtime = "nodejs";

type PostType = "ANNOUNCEMENT" | "EVENT" | "LOST_FOUND" | "VOLUNTEER" | "DISCUSSION";

type CreatePostBody = {
  type: PostType;
  title: string;
  body: string;
  images?: string[];
  district: string;
  tehsil?: string;
  event?: {
    date: string;
    location: string;
    coordinates?: { lat: number; lng: number };
    maxAttendees?: number;
    ticketPrice?: number;
  };
  lostFound?: {
    itemType: "LOST" | "FOUND";
    category: string;
    lastSeenLocation: string;
    contactPhone: string;
  };
  volunteer?: {
    organization: string;
    skills: string[];
    startDate: string;
    endDate?: string;
    slots: number;
  };
};

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district") || undefined;
    const type = searchParams.get("type") as PostType | null;

    const posts = await prisma.post.findMany({
      where: {
        district,
        type: type ?? undefined
      },
      include: {
        author: { select: { id: true, email: true } },
        event: true,
        lostFound: true,
        volunteer: true
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 120
    });

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreatePostBody;
    if (!body.title?.trim() || !body.body?.trim() || !body.type || !body.district) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        type: body.type,
        title: body.title.trim(),
        body: body.body.trim(),
        images: body.images ?? [],
        district: body.district,
        tehsil: body.tehsil,
        event:
          body.type === "EVENT" && body.event
            ? {
                create: {
                  date: new Date(body.event.date),
                  location: body.event.location,
                  coordinates: body.event.coordinates ? body.event.coordinates : undefined,
                  maxAttendees: body.event.maxAttendees,
                  ticketPrice: body.event.ticketPrice
                }
              }
            : undefined,
        lostFound:
          body.type === "LOST_FOUND" && body.lostFound
            ? {
                create: {
                  itemType: body.lostFound.itemType,
                  category: body.lostFound.category,
                  lastSeenLocation: body.lostFound.lastSeenLocation,
                  contactPhone: body.lostFound.contactPhone
                }
              }
            : undefined,
        volunteer:
          body.type === "VOLUNTEER" && body.volunteer
            ? {
                create: {
                  organization: body.volunteer.organization,
                  skills: body.volunteer.skills,
                  startDate: new Date(body.volunteer.startDate),
                  endDate: body.volunteer.endDate ? new Date(body.volunteer.endDate) : undefined,
                  slots: body.volunteer.slots
                }
              }
            : undefined
      },
      include: {
        author: { select: { id: true, email: true } },
        event: true,
        lostFound: true,
        volunteer: true
      }
    });

    const io = getEmergencySocketServer();
    io?.to("admin-dashboard").emit("community:post:new", post);
    io?.to(`district-${post.district}`).emit("community:post:new", post);

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    });
    if (admins.length) {
      const notifications = await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: `New post in ${post.district}`,
              body: `${post.title}`
            }
          })
        )
      );
      for (const notification of notifications) {
        io?.to(`user-${notification.userId}`).emit("notification:new", notification);
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create post" }, { status: 500 });
  }
}
