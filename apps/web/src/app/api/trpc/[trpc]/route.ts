import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { auth } from "@/server/auth";
import { appRouter } from "@/server/trpc/root";
import { createTRPCContext } from "@/server/trpc/context";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { sanitizeUnknownInput } from "@/lib/security/inputSanitization";
import { writeAuditLog } from "@/lib/security/audit";

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
}

function getSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  for (const key of ["__Secure-next-auth.session-token", "next-auth.session-token", "authjs.session-token"]) {
    const match = cookieHeader.match(new RegExp(`${key}=([^;]+)`));
    if (match?.[1]) return match[1];
  }
  return null;
}

async function secureHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ip = getClientIp(req);
  const method = req.method.toUpperCase();
  const userAgent = req.headers.get("user-agent") || "unknown";
  const session = await auth();
  const userId = session?.user?.id || "anonymous";

  const rule = url.pathname.includes("/api/trpc/advisor.") ? "advisor_user" : "trpc_ip";
  const rate = await enforceRateLimit(rule, rule === "advisor_user" ? userId : ip);
  if (!rate.allowed) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds || 60) }
    });
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfValid = await verifyCsrfToken({
      tokenFromHeader: req.headers.get("x-csrf-token"),
      tokenFromCookie: (() => {
        const cookieHeader = req.headers.get("cookie") || "";
        const match = cookieHeader.match(/kc-csrf-token=([^;]+)/);
        return match?.[1] ?? null;
      })(),
      sessionId: getSessionCookie(req)
    });
    if (!csrfValid) {
      return new Response("Invalid CSRF token", { status: 403 });
    }
  }

  let normalizedReq = req;
  let payload: unknown = {};
  if (method !== "GET") {
    try {
      payload = await req.clone().json();
      const sanitized = sanitizeUnknownInput(payload);
      normalizedReq = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(sanitized)
      });
    } catch {
      payload = {};
    }
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: normalizedReq,
    router: appRouter,
    createContext: createTRPCContext
  });

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    await writeAuditLog({
      userId,
      action: `TRPC_${method}_${url.pathname}`,
      resourceType: "tRPC",
      resourceId: url.pathname,
      ipAddress: ip,
      userAgent,
      payload,
      success: response.status < 400,
      errorCode: response.status >= 400 ? String(response.status) : undefined
    }).catch(() => undefined);
  }

  return response;
}

export const GET = secureHandler;
export const POST = secureHandler;
