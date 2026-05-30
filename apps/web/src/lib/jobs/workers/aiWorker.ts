import Anthropic from "@anthropic-ai/sdk";
import { Job, Worker } from "bullmq";
import { prisma } from "@kashmir/db";
import { redisConnection } from "../queues";

type AIJobName = "GENERATE_PRODUCT_DESCRIPTION" | "TRANSLATE_STOREFRONT" | "BATCH_SEO_OPTIMIZE";

type AIJobPayload =
  | {
      productId: string;
      language: "en" | "ur" | "hi";
      tone?: string;
    }
  | {
      storefrontId: string;
      targetLanguage: "en" | "ur" | "hi";
    }
  | {
      storefrontIds: string[];
      locale: "en" | "ur" | "hi";
    };

const anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicKey) throw new Error("Missing ANTHROPIC_API_KEY");

const client = new Anthropic({ apiKey: anthropicKey });
const CACHE_TTL_SECONDS = 24 * 60 * 60;

async function getCache(key: string): Promise<string | null> {
  const value = await redisConnection.get(key);
  return typeof value === "string" ? value : null;
}

async function setCache(key: string, value: string): Promise<void> {
  await redisConnection.set(key, value, "EX", CACHE_TTL_SECONDS);
}

async function persistGeneratedContent(kind: string, entityId: string, content: string): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AI_Generated_Content" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kind TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      content TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "AI_Generated_Content" (kind, "entityId", content) VALUES ($1, $2, $3);`,
    kind,
    entityId,
    content
  );
}

async function generateText(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }]
  });
  const text = response.content.find((part) => part.type === "text");
  return text?.text ?? "";
}

export const aiWorker = new Worker<AIJobPayload, { content: string }, AIJobName>(
  "ai-preprocessing",
  async (job: Job<AIJobPayload, { content: string }, AIJobName>) => {
    const cacheKey = `jobs:ai:${job.name}:${JSON.stringify(job.data)}`;
    const cached = await getCache(cacheKey);
    if (cached) return { content: cached };

    if (job.name === "GENERATE_PRODUCT_DESCRIPTION") {
      const data = job.data as Extract<AIJobPayload, { productId: string }>;
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
        select: { id: true, name: true, description: true }
      });
      if (!product) throw new Error(`Product ${data.productId} not found`);
      const content = await generateText(
        `Write a ${data.tone ?? "premium"} product description for "${product.name}" in ${data.language}. Keep it concise and sales-ready.`
      );
      await prisma.product.update({
        where: { id: product.id },
        data: { description: content }
      });
      await persistGeneratedContent("product-description", product.id, content);
      await setCache(cacheKey, content);
      return { content };
    }

    if (job.name === "TRANSLATE_STOREFRONT") {
      const data = job.data as Extract<AIJobPayload, { storefrontId: string }>;
      const storefront = await prisma.storefront.findUnique({
        where: { id: data.storefrontId },
        select: { id: true, name: true, description: true }
      });
      if (!storefront) throw new Error(`Storefront ${data.storefrontId} not found`);
      const content = await generateText(
        `Translate this storefront description to ${data.targetLanguage}. Storefront: ${storefront.name}. Text: ${storefront.description ?? ""}`
      );
      await prisma.storefront.update({
        where: { id: storefront.id },
        data: { description: content }
      });
      await persistGeneratedContent("storefront-translation", storefront.id, content);
      await setCache(cacheKey, content);
      return { content };
    }

    const data = job.data as Extract<AIJobPayload, { storefrontIds: string[] }>;
    const storefronts = await prisma.storefront.findMany({
      where: { id: { in: data.storefrontIds } },
      select: { id: true, name: true, description: true, sector: true }
    });
    const results: string[] = [];
    for (const storefront of storefronts) {
      const content = await generateText(
        `Generate SEO optimized meta description in ${data.locale} for Kashmir storefront "${storefront.name}" in sector ${storefront.sector}.`
      );
      await persistGeneratedContent("seo-meta", storefront.id, content);
      results.push(`${storefront.id}:${content}`);
    }
    const merged = results.join("\n");
    await setCache(cacheKey, merged);
    return { content: merged };
  },
  {
    connection: redisConnection,
    concurrency: 10
  }
);
