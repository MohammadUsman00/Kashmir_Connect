import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { prisma } from "@kashmir/db";
import { auth } from "@/server/auth";
import { streamAssistantResponse, type ChatMessage } from "@/lib/ai/agent";
import type { AssistantLanguage, AssistantMode } from "@/lib/ai/prompts";

export const runtime = "nodejs";

const redis = Redis.fromEnv();

type ChatBody = {
  messages: ChatMessage[];
  mode: AssistantMode;
  language: AssistantLanguage;
  sessionId: string;
  action?: "clear";
};

function monthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function extractImportantFacts(messages: ChatMessage[]): string[] {
  const facts: string[] = [];
  for (const message of messages.filter((item) => item.role === "user")) {
    const content = message.content.toLowerCase();
    if (content.includes("i prefer") || content.includes("my budget") || content.includes("trip date")) {
      facts.push(message.content.slice(0, 180));
    }
  }
  return facts.slice(-5);
}

async function getDailyLimit(userId: string | null): Promise<number> {
  if (!userId) return 20;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, profile: true }
  });
  const profile = (user?.profile ?? {}) as Record<string, unknown>;
  const premium = profile.plan === "premium" || user?.role === "ADMIN";
  return premium ? 200 : 20;
}

async function enforceDailyRateLimit(userId: string | null): Promise<{ ok: true } | { ok: false; used: number; limit: number }> {
  const key = `ai:rate:${userId ?? "anonymous"}:${dayKey()}`;
  const used = await redis.incr(key);
  if (used === 1) {
    await redis.expire(key, 60 * 60 * 24);
  }
  const limit = await getDailyLimit(userId);
  if (used > limit) {
    return { ok: false, used, limit };
  }
  return { ok: true };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ChatBody;
    const { messages, mode, language, sessionId, action } = body;
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (action === "clear") {
      await redis.del(`ai:memory:${sessionId}`);
      if (userId) await redis.del(`ai:facts:${userId}`);
      return NextResponse.json({ success: true });
    }

    if (!messages?.length) return NextResponse.json({ error: "messages are required" }, { status: 400 });

    const limited = await enforceDailyRateLimit(userId);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Daily message limit reached (${limited.limit}/day).` },
        { status: 429 }
      );
    }

    const cacheKey = `ai:cache:${hashPayload({ messages, mode, language })}`;
    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify({ text: cached })}\n\n`));
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ cached: true })}\n\n`));
          controller.close();
        }
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive"
        }
      });
    }

    const memoryKey = `ai:memory:${sessionId}`;
    const prior = (await redis.get<ChatMessage[]>(memoryKey)) ?? [];
    const merged = [...prior, ...messages].slice(-20);

    const factKey = userId ? `ai:facts:${userId}` : null;
    const existingFacts = factKey ? ((await redis.get<string[]>(factKey)) ?? []) : [];
    const newFacts = extractImportantFacts(messages);
    const combinedFacts = [...existingFacts, ...newFacts].slice(-20);
    if (factKey) {
      await redis.set(factKey, combinedFacts, { ex: 60 * 60 * 24 * 30 });
    }

    const encoder = new TextEncoder();
    let finalText = "";
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, payload: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          for await (const event of streamAssistantResponse({
            mode,
            language,
            messages: merged,
            facts: combinedFacts.join("\n- ")
          })) {
            if (event.type === "text") {
              finalText += event.text;
              send("message", { text: event.text });
            } else if (event.type === "tool_result") {
              send("tool_result", { name: event.name, result: event.result });
            } else if (event.type === "done") {
              finalText = event.fullText || finalText;
              send("done", { done: true });
            }
          }

          await redis.set(cacheKey, finalText, { ex: 60 * 60 });
          const nextMemory = [...merged, { role: "assistant" as const, content: finalText }].slice(-20);
          await redis.set(memoryKey, nextMemory, { ex: 60 * 60 * 24 * 14 });

          if (userId) {
            await prisma.aIAdvisorUsage.upsert({
              where: { userId_month: { userId, month: monthKey() } },
              create: { userId, month: monthKey(), count: 1 },
              update: { count: { increment: 1 } }
            });
          }
          controller.close();
        } catch (error) {
          send("error", {
            message: error instanceof Error ? error.message : "AI streaming failed"
          });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat API failed" },
      { status: 500 }
    );
  }
}
