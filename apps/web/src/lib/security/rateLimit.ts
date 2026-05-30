import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RuleName = "auth_ip" | "trpc_ip" | "advisor_user" | "storefront_ip";

const redis = Redis.fromEnv();
const memoryFallback = new Map<string, { count: number; resetAt: number }>();

const rules = {
  auth_ip: { limit: 5, windowMs: 60_000, ratelimit: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(5, "1 m"), prefix: "rl:auth" }) },
  trpc_ip: { limit: 100, windowMs: 60_000, ratelimit: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(100, "1 m"), prefix: "rl:trpc" }) },
  advisor_user: { limit: 10, windowMs: 60 * 60_000, ratelimit: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(10, "1 h"), prefix: "rl:advisor" }) },
  storefront_ip: { limit: 200, windowMs: 60_000, ratelimit: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(200, "1 m"), prefix: "rl:storefront" }) }
} as const;

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining?: number;
};

function memoryLimit(rule: RuleName, key: string): RateLimitDecision {
  const now = Date.now();
  const ruleCfg = rules[rule];
  const mapKey = `${rule}:${key}`;
  const current = memoryFallback.get(mapKey);

  if (!current || current.resetAt <= now) {
    memoryFallback.set(mapKey, { count: 1, resetAt: now + ruleCfg.windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: ruleCfg.limit - 1 };
  }

  current.count += 1;
  memoryFallback.set(mapKey, current);
  if (current.count > ruleCfg.limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000), remaining: 0 };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, ruleCfg.limit - current.count)
  };
}

export async function enforceRateLimit(rule: RuleName, key: string): Promise<RateLimitDecision> {
  if (!key) return { allowed: true, retryAfterSeconds: 0 };
  try {
    const result = await rules[rule].ratelimit.limit(key);
    return {
      allowed: result.success,
      retryAfterSeconds: result.reset ? Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)) : 60,
      remaining: result.remaining
    };
  } catch {
    return memoryLimit(rule, key);
  }
}
