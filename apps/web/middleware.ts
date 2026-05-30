import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth";

export default auth((req: NextRequest & { auth?: Awaited<ReturnType<typeof auth>> }) => {
  const pathname = req.nextUrl.pathname;
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"]
};
