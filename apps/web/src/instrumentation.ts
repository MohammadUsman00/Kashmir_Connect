import * as Sentry from "@sentry/nextjs";

export async function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.2),
    environment: process.env.NODE_ENV
  });
}

export function withAIAdvisorTransaction<T>(operation: () => Promise<T>): Promise<T> {
  return Sentry.startSpan(
    {
      op: "ai.advisor.query",
      name: "AI Advisor Query"
    },
    operation
  );
}

export function withSOSTransaction<T>(operation: () => Promise<T>): Promise<T> {
  return Sentry.startSpan(
    {
      op: "emergency.sos",
      name: "SOS Event"
    },
    operation
  );
}

export function withStorefrontLoadTransaction<T>(operation: () => Promise<T>): Promise<T> {
  return Sentry.startSpan(
    {
      op: "storefront.load",
      name: "Storefront Load"
    },
    operation
  );
}
