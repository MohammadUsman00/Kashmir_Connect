import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { enforceRateLimit } from "@/lib/security/rateLimit";

const allowedBots = [/googlebot/i, /bingbot/i];
const blockedBots = /bot|crawl|spider|scrape/i;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

function getSessionId(req: NextRequest): string | null {
  return (
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    null
  );
}

function isStateChanging(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

function isKashmirRegion(req: NextRequest): boolean {
  const country = req.geo?.country || "";
  const region = req.geo?.region || "";
  return country === "IN" && /jammu|kashmir/i.test(region);
}

export default auth(async (req: NextRequest & { auth?: Awaited<ReturnType<typeof auth>> }) => {
  const pathname = req.nextUrl.pathname;
  const method = req.method.toUpperCase();
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "";
  const userId = req.auth?.user?.id || req.headers.get("x-user-id") || ip;

  // a) BOT BLOCKING
  if (blockedBots.test(userAgent) && !allowedBots.some((pattern) => pattern.test(userAgent))) {
    return new NextResponse("Forbidden bot traffic", { status: 403 });
  }

  // b) RATE LIMITING
  const rateRule =
    pathname.startsWith("/api/auth/")
      ? "auth_ip"
      : pathname.startsWith("/api/trpc/advisor.")
        ? "advisor_user"
        : pathname.startsWith("/api/trpc/")
          ? "trpc_ip"
          : pathname.startsWith("/s/")
            ? "storefront_ip"
            : null;

  if (rateRule) {
    const rate = await enforceRateLimit(
      rateRule,
      rateRule === "advisor_user" ? userId : ip
    );
    if (!rate.allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds || 60)
        }
      });
    }
  }

  // c) GEO-BASED LANGUAGE
  const kashmirRegion = isKashmirRegion(req);
  const lang = kashmirRegion ? "ur" : "en";
  if (pathname.startsWith("/s/") && kashmirRegion && !req.nextUrl.searchParams.has("lang")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.searchParams.set("lang", "ur");
    const redirectRes = NextResponse.redirect(redirectUrl);
    redirectRes.cookies.set("x-lang", lang, { path: "/", sameSite: "lax", secure: true });
    return redirectRes;
  }

  // protected dashboard routes
  if (!req.auth?.user) {
    if (pathname.startsWith("/dashboard")) {
      const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
      return NextResponse.redirect(signInUrl);
    }
  }

  // d) CSRF PROTECTION
  const skipCsrf =
    pathname.startsWith("/api/webhooks/") || pathname.startsWith("/api/auth/");
  if (isStateChanging(method) && !skipCsrf) {
    const valid = await verifyCsrfToken({
      tokenFromHeader: req.headers.get("x-csrf-token"),
      tokenFromCookie: req.cookies.get("kc-csrf-token")?.value || null,
      sessionId: getSessionId(req)
    });
    if (!valid) {
      return new NextResponse("Invalid CSRF token", { status: 403 });
    }
  }

  // e) SECURITY HEADERS
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'"
  ].join("; ");

  const res = NextResponse.next();
  res.cookies.set("x-lang", lang, { path: "/", sameSite: "lax", secure: true });
  res.headers.set("x-csp-nonce", nonce);
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

  return res;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"
  ]
};
