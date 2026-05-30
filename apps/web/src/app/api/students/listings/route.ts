import { NextResponse } from "next/server";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";

export const runtime = "nodejs";

type ListingBody =
  | {
      listingType: "INTERNSHIP";
      companyName: string;
      role: string;
      location: string;
      stipend?: string;
      deadline: string;
      applyUrl: string;
    }
  | {
      listingType: "JOB";
      companyName: string;
      role: string;
      location: string;
      salary?: string;
      deadline: string;
      applyUrl: string;
      preferLocal?: boolean;
      type: "FULL_TIME" | "PART_TIME" | "CONTRACT";
    };

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || undefined;
    const preferLocal =
      searchParams.get("preferLocal") === "true"
        ? true
        : searchParams.get("preferLocal") === "false"
          ? false
          : undefined;
    const listingType = searchParams.get("listingType") as "INTERNSHIP" | "JOB" | null;

    if (listingType === "INTERNSHIP") {
      const internships = await prisma.internship.findMany({
        where: {
          location: location ? { contains: location, mode: "insensitive" } : undefined
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });
      return NextResponse.json({ internships, jobs: [] });
    }

    if (listingType === "JOB") {
      const jobs = await prisma.job.findMany({
        where: {
          location: location ? { contains: location, mode: "insensitive" } : undefined,
          preferLocal
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });
      return NextResponse.json({ internships: [], jobs });
    }

    const [internships, jobs] = await Promise.all([
      prisma.internship.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 80 })
    ]);
    return NextResponse.json({ internships, jobs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as ListingBody;

    if (body.listingType === "INTERNSHIP") {
      const internship = await prisma.internship.create({
        data: {
          companyName: body.companyName,
          role: body.role,
          location: body.location,
          stipend: body.stipend,
          deadline: new Date(body.deadline),
          applyUrl: body.applyUrl,
          postedBy: session.user.id
        }
      });
      return NextResponse.json({ internship });
    }

    const job = await prisma.job.create({
      data: {
        companyName: body.companyName,
        role: body.role,
        location: body.location,
        salary: body.salary,
        deadline: new Date(body.deadline),
        applyUrl: body.applyUrl,
        preferLocal: Boolean(body.preferLocal),
        type: body.type,
        postedBy: session.user.id
      }
    });
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create listing" }, { status: 500 });
  }
}
