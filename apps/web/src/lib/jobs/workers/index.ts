import { aiWorker } from "./aiWorker";
import { analyticsWorker } from "./analyticsWorker";
import { emailWorker } from "./emailWorker";
import { imageWorker } from "./imageWorker";
import { shutdownQueues } from "../queues";

const workers = [emailWorker, aiWorker, analyticsWorker, imageWorker];

for (const worker of workers) {
  worker.on("completed", (job) => {
    // eslint-disable-next-line no-console
    console.log(`[worker:${worker.name}] completed job ${job.id} (${job.name})`);
  });
  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker:${worker.name}] failed job ${job?.id} (${job?.name})`, err);
  });
}

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}. Shutting down workers...`);
  await Promise.all(workers.map((worker) => worker.close()));
  await shutdownQueues();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
