import { Job, Worker } from "bullmq";
import { AnalyticsEventType } from "@prisma/client";
import { prisma } from "@kashmir/db";
import { ensureAnalyticsRepeatJob, redisConnection } from "../queues";

type AnalyticsBufferEvent = {
  storefrontId: string;
  type: AnalyticsEventType;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

const BUFFER_KEY = "analytics:buffer";
const BATCH_SIZE = 1000;

function normalizeEventType(value: string): AnalyticsEventType {
  if (value === "WHATSAPP_CLICK") return "WHATSAPP_CLICK";
  if (value === "PRODUCT_VIEW") return "PRODUCT_VIEW";
  return "VIEW";
}

async function aggregateHourlySummaries(rows: AnalyticsBufferEvent[]): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AnalyticsSummary" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "storefrontId" TEXT NOT NULL,
      "hourBucket" TIMESTAMP NOT NULL,
      views INT NOT NULL DEFAULT 0,
      "whatsappClicks" INT NOT NULL DEFAULT 0,
      "productViews" INT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE("storefrontId", "hourBucket")
    );
  `);

  const grouped = new Map<string, { storefrontId: string; hourBucket: Date; views: number; whatsappClicks: number; productViews: number }>();
  for (const event of rows) {
    const date = event.createdAt ? new Date(event.createdAt) : new Date();
    date.setMinutes(0, 0, 0);
    const key = `${event.storefrontId}:${date.toISOString()}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        storefrontId: event.storefrontId,
        hourBucket: date,
        views: 0,
        whatsappClicks: 0,
        productViews: 0
      });
    }
    const entry = grouped.get(key)!;
    if (event.type === "WHATSAPP_CLICK") entry.whatsappClicks += 1;
    else if (event.type === "PRODUCT_VIEW") entry.productViews += 1;
    else entry.views += 1;
  }

  for (const entry of grouped.values()) {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "AnalyticsSummary" ("storefrontId", "hourBucket", views, "whatsappClicks", "productViews", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT ("storefrontId", "hourBucket")
      DO UPDATE SET
        views = "AnalyticsSummary".views + EXCLUDED.views,
        "whatsappClicks" = "AnalyticsSummary"."whatsappClicks" + EXCLUDED."whatsappClicks",
        "productViews" = "AnalyticsSummary"."productViews" + EXCLUDED."productViews",
        "updatedAt" = NOW();
      `,
      entry.storefrontId,
      entry.hourBucket.toISOString(),
      entry.views,
      entry.whatsappClicks,
      entry.productViews
    );
  }
}

export const analyticsWorker = new Worker(
  "analytics",
  async (_job: Job) => {
    const records = await redisConnection.lrange(BUFFER_KEY, 0, BATCH_SIZE - 1);
    if (records.length === 0) return { flushed: 0 };

    await redisConnection.ltrim(BUFFER_KEY, records.length, -1);

    const parsed: AnalyticsBufferEvent[] = records
      .map((item) => {
        try {
          const raw = JSON.parse(item) as AnalyticsBufferEvent;
          return {
            storefrontId: raw.storefrontId,
            type: normalizeEventType(raw.type),
            metadata: raw.metadata ?? {},
            createdAt: raw.createdAt
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is AnalyticsBufferEvent => Boolean(item?.storefrontId));

    if (parsed.length === 0) return { flushed: 0 };

    await prisma.analyticsEvent.createMany({
      data: parsed.map((event) => ({
        storefrontId: event.storefrontId,
        type: event.type,
        metadata: event.metadata,
        createdAt: event.createdAt ? new Date(event.createdAt) : new Date()
      }))
    });

    await aggregateHourlySummaries(parsed);
    return { flushed: parsed.length };
  },
  {
    connection: redisConnection,
    concurrency: 1
  }
);

void ensureAnalyticsRepeatJob();
