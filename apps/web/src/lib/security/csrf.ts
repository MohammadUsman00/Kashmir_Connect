import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";
import { auth } from "@/server/auth";

const redis = Redis.fromEnv();
const CSRF_PREFIX = "csrf:token:";
const CSRF_TTL_SECONDS = 60 * 60;

export type CsrfRecord = {
  token: string;
  sessionId: string;
  userId?: string;
  issuedAt: string;
};

export async function issueCsrfToken(sessionId: string, userId?: string): Promise<CsrfRecord> {
  const token = randomUUID().replace(/-/g, "");
  const record: CsrfRecord = {
    token,
    sessionId,
    userId,
    issuedAt: new Date().toISOString()
  };
  await redis.set(`${CSRF_PREFIX}${token}`, record, { ex: CSRF_TTL_SECONDS });
  return record;
}

export async function verifyCsrfToken(input: {
  tokenFromHeader: string | null;
  tokenFromCookie: string | null;
  sessionId: string | null;
}): Promise<boolean> {
  const { tokenFromHeader, tokenFromCookie, sessionId } = input;
  if (!tokenFromHeader || !tokenFromCookie || !sessionId) return false;
  if (tokenFromHeader !== tokenFromCookie) return false;

  const record = await redis.get<CsrfRecord>(`${CSRF_PREFIX}${tokenFromHeader}`);
  if (!record) return false;
  return record.sessionId === sessionId;
}

export async function revokeCsrfToken(token: string): Promise<void> {
  await redis.del(`${CSRF_PREFIX}${token}`);
}

export async function getServerSideSessionWithCsrf(): Promise<{
  session: Awaited<ReturnType<typeof auth>>;
  csrfToken: string | null;
}> {
  const session = await auth();
  const sessionId =
    session?.user?.id
      ? `user-${session.user.id}`
      : null;
  if (!sessionId) {
    return { session, csrfToken: null };
  }
  const token = await issueCsrfToken(sessionId, session.user.id);
  return { session, csrfToken: token.token };
}
