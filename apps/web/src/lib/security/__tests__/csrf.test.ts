import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const redisStore = new Map<string, unknown>();

jest.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: () => ({
      set: async (key: string, value: unknown) => {
        redisStore.set(key, value);
      },
      get: async (key: string) => redisStore.get(key),
      del: async (key: string) => {
        redisStore.delete(key);
      }
    })
  }
}));

jest.mock("@/server/auth", () => ({
  auth: async () => null
}));

import { issueCsrfToken, verifyCsrfToken } from "../csrf";

describe("CSRF", () => {
  beforeEach(() => {
    redisStore.clear();
  });

  it("issues and verifies a valid token", async () => {
    const record = await issueCsrfToken("session-123", "user-1");
    const valid = await verifyCsrfToken({
      tokenFromHeader: record.token,
      tokenFromCookie: record.token,
      sessionId: "session-123"
    });
    expect(valid).toBe(true);
  });

  it("rejects mismatched token header/cookie", async () => {
    const record = await issueCsrfToken("session-abc", "user-1");
    const valid = await verifyCsrfToken({
      tokenFromHeader: record.token,
      tokenFromCookie: `${record.token}-wrong`,
      sessionId: "session-abc"
    });
    expect(valid).toBe(false);
  });

  it("rejects wrong session id", async () => {
    const record = await issueCsrfToken("session-xyz", "user-1");
    const valid = await verifyCsrfToken({
      tokenFromHeader: record.token,
      tokenFromCookie: record.token,
      sessionId: "session-other"
    });
    expect(valid).toBe(false);
  });
});
