import { NextResponse } from "next/server";
import { prisma } from "@kashmir/db";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const note = await prisma.note.update({
      where: { id },
      data: { downloads: { increment: 1 } },
      select: { id: true, downloads: true, fileUrl: true }
    });
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to track download" }, { status: 500 });
  }
}
