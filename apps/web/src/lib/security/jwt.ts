import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";
import { jwtVerify, SignJWT } from "jose";

const redis = Redis.fromEnv();
const encoder = new TextEncoder();
const accessSecret = encoder.encode(process.env.JWT_ACCESS_SECRET || "dev-access-secret");
const refreshSecret = encoder.encode(process.env.JWT_REFRESH_SECRET || "dev-refresh-secret");

type JwtRole = "USER" | "MERCHANT" | "ADMIN";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  familyId: string;
  refreshId: string;
}

type RefreshRecord = {
  userId: string;
  familyId: string;
  refreshId: string;
  expiresAt: string;
  valid: boolean;
};

function refreshKey(refreshId: string): string {
  return `jwt:refresh:${refreshId}`;
}

function familyKey(familyId: string): string {
  return `jwt:family:${familyId}`;
}

async function signAccessToken(params: { userId: string; role: JwtRole }): Promise<string> {
  return await new SignJWT({ role: params.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(params.userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret);
}

async function signRefreshToken(params: {
  userId: string;
  role: JwtRole;
  familyId: string;
  refreshId: string;
}): Promise<string> {
  return await new SignJWT({ role: params.role, familyId: params.familyId, refreshId: params.refreshId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(params.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret);
}

export async function issueTokenPair(input: {
  userId: string;
  role: JwtRole;
  familyId?: string;
}): Promise<TokenPair> {
  const familyId = input.familyId ?? randomUUID();
  const refreshId = randomUUID();
  const accessToken = await signAccessToken({ userId: input.userId, role: input.role });
  const refreshToken = await signRefreshToken({
    userId: input.userId,
    role: input.role,
    familyId,
    refreshId
  });

  const record: RefreshRecord = {
    userId: input.userId,
    familyId,
    refreshId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    valid: true
  };
  await redis.set(refreshKey(refreshId), record, { ex: 7 * 24 * 60 * 60 });
  await redis.sadd(familyKey(familyId), refreshId);
  await redis.expire(familyKey(familyId), 7 * 24 * 60 * 60);
  return { accessToken, refreshToken, familyId, refreshId };
}

export async function rotateRefreshToken(refreshToken: string): Promise<TokenPair> {
  const verification = await jwtVerify(refreshToken, refreshSecret);
  const userId = verification.payload.sub;
  const role = verification.payload.role as JwtRole | undefined;
  const familyId = verification.payload.familyId as string | undefined;
  const refreshId = verification.payload.refreshId as string | undefined;

  if (!userId || !role || !familyId || !refreshId) {
    throw new Error("Invalid refresh token payload");
  }

  const record = await redis.get<RefreshRecord>(refreshKey(refreshId));
  if (!record || !record.valid) {
    // stolen-token reuse detection: invalidate entire family
    await invalidateRefreshFamily(familyId);
    throw new Error("Refresh token reuse detected. Family invalidated.");
  }

  await redis.set(refreshKey(refreshId), { ...record, valid: false }, { ex: 7 * 24 * 60 * 60 });
  return await issueTokenPair({ userId, role, familyId });
}

export async function invalidateRefreshFamily(familyId: string): Promise<void> {
  const members = (await redis.smembers<string[]>(familyKey(familyId))) ?? [];
  for (const refreshId of members) {
    const existing = await redis.get<RefreshRecord>(refreshKey(refreshId));
    if (existing) {
      await redis.set(refreshKey(refreshId), { ...existing, valid: false }, { ex: 7 * 24 * 60 * 60 });
    }
  }
}
