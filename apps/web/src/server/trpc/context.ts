import { auth } from "@/server/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma, StorefrontRepository, StorefrontService } from "@kashmir/db";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export type AppUser = {
  id: string;
  email: string;
  role: "MERCHANT" | "ADMIN" | "USER";
  storefrontId: string | null;
};

async function getUserFromSupabaseJwt(token: string | undefined): Promise<AppUser | null> {
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: data.user.email },
    select: {
      id: true,
      email: true,
      role: true,
      storefront: { select: { id: true } }
    }
  });

  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    storefrontId: dbUser.storefront?.id ?? null
  };
}

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const authHeader = opts.req.headers.get("authorization");
  const jwtToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const session = await auth();
  const jwtUser = await getUserFromSupabaseJwt(jwtToken);

  const user: AppUser | null =
    jwtUser ??
    (session?.user
      ? {
          id: session.user.id,
          email: session.user.email ?? "",
          role: session.user.role,
          storefrontId: session.user.storefrontId
        }
      : null);

  return {
    prisma,
    user,
    session,
    ip: opts.req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    storefrontService: new StorefrontService(new StorefrontRepository())
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
