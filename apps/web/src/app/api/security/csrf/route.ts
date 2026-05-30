import { NextResponse } from "next/server";
import { getServerSideSessionWithCsrf } from "@/lib/security/csrf";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const { csrfToken } = await getServerSideSessionWithCsrf();
  if (!csrfToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = NextResponse.json({ csrfToken });
  res.cookies.set("kc-csrf-token", csrfToken, {
    path: "/",
    sameSite: "lax",
    secure: true,
    httpOnly: false,
    maxAge: 60 * 60
  });
  return res;
}
