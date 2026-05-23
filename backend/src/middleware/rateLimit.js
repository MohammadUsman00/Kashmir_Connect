const buckets = new Map();

function prune() {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit({ windowMs = 60_000, max = 60, keyPrefix = "rl" } = {}) {
  return (req, res, next) => {
    prune();
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    let entry = buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({ error: "Too many requests. Please try again shortly." });
    }

    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    return next();
  };
}
