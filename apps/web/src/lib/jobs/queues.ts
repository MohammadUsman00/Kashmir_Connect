import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_REST_URL;

if (!redisUrl) {
  throw new Error("Missing REDIS_URL (or UPSTASH_REDIS_REST_URL) for BullMQ queues");
}

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

const defaultJobOptions = {
  removeOnComplete: 1000,
  removeOnFail: 1000
};

export const emailQueue = new Queue("email", {
  connection: redisConnection,
  defaultJobOptions
});

export const emailDeadLetterQueue = new Queue("email-dlq", {
  connection: redisConnection,
  defaultJobOptions
});

export const aiQueue = new Queue("ai-preprocessing", {
  connection: redisConnection,
  defaultJobOptions
});

export const analyticsQueue = new Queue("analytics", {
  connection: redisConnection,
  defaultJobOptions
});

export const imageQueue = new Queue("image-processing", {
  connection: redisConnection,
  defaultJobOptions
});

export const emailQueueEvents = new QueueEvents("email", { connection: redisConnection });

let analyticsRepeatRegistered = false;

export async function ensureAnalyticsRepeatJob(): Promise<void> {
  if (analyticsRepeatRegistered) return;
  await analyticsQueue.add(
    "BATCH_ANALYTICS_FLUSH",
    {},
    {
      repeat: { every: 60_000 },
      jobId: "analytics-batch-flush",
      removeOnComplete: true,
      removeOnFail: false
    }
  );
  analyticsRepeatRegistered = true;
}

export async function shutdownQueues(): Promise<void> {
  await Promise.all([
    emailQueue.close(),
    emailDeadLetterQueue.close(),
    aiQueue.close(),
    analyticsQueue.close(),
    imageQueue.close(),
    emailQueueEvents.close(),
    redisConnection.quit()
  ]);
}
