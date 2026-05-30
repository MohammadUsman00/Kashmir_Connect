import { PostHog } from "posthog-node";

const key = process.env.POSTHOG_API_KEY;
const host = process.env.POSTHOG_HOST ?? "https://app.posthog.com";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, { host });
  }
  return client;
}

export async function trackPosthogEvent(
  distinctId: string,
  event: "signup" | "storefront_created" | "product_added" | "ai_query" | "sos_triggered",
  properties: Record<string, unknown> = {}
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  ph.capture({
    distinctId,
    event,
    properties
  });
  await ph.flush();
}
