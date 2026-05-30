import { NextResponse } from "next/server";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

type CreateNoteBody = {
  subject: string;
  class: string;
  university: string;
  fileUrl: string;
  fileType?: "pdf" | "image";
};

async function extractTextFromImage(imageUrl: string): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(imageUrl);
    return result.data.text?.slice(0, 8000) || "";
  } finally {
    await worker.terminate();
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject") || undefined;
    const university = searchParams.get("university") || undefined;
    const className = searchParams.get("class") || undefined;

    const notes = await prisma.note.findMany({
      where: {
        subject: subject ? { contains: subject, mode: "insensitive" } : undefined,
        university: university ? { contains: university, mode: "insensitive" } : undefined,
        class: className ? { contains: className, mode: "insensitive" } : undefined
      },
      include: {
        author: { select: { email: true } }
      },
      orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
      take: 120
    });
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as CreateNoteBody;
    if (!body.subject || !body.class || !body.university || !body.fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ocrText =
      body.fileType === "image"
        ? await extractTextFromImage(body.fileUrl).catch(() => "")
        : "";

    const note = await prisma.note.create({
      data: {
        authorId: session.user.id,
        subject: body.subject,
        class: body.class,
        university: body.university,
        fileUrl: body.fileUrl,
        ocrText
      }
    });

    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to upload note" }, { status: 500 });
  }
}
