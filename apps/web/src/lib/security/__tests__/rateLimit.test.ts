import { describe, expect, it, jest, beforeEach } from "@jest/globals";

jest.mock("@upstash/ratelimit", () => ({
  Ratelimit: class MockRatelimit {
    static fixedWindow() {
      return {};
    }
    constructor() {}
    async limit() {
      throw new Error("Upstash unavailable");
    }
  }
}));

jest.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({})
  }
}));

import { enforceRateLimit } from "../rateLimit";

describe("Rate limit fallback", () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it("allows requests under limit", async () => {
    const first = await enforceRateLimit("auth_ip", "1.1.1.1");
    const second = await enforceRateLimit("auth_ip", "1.1.1.1");
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });

  it("blocks after exceeding limit", async () => {
    for (let i = 0; i < 5; i += 1) {
      await enforceRateLimit("auth_ip", "2.2.2.2");
    }
    const blocked = await enforceRateLimit("auth_ip", "2.2.2.2");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
