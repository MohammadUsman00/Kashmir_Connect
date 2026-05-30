import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { TRPCContext } from "./context";
import { advisorRateLimit, analyticsRateLimit, authRateLimit } from "./rate-limit";
export { requirePermission, hasPermission, rolePermissions } from "@/lib/security/rbac";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin role required" });
  }
  return next();
});

export const isMerchant = t.middleware(async ({ ctx, next, rawInput }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }

  if (ctx.user.role === "ADMIN") {
    return next();
  }

  if (ctx.user.role !== "MERCHANT") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Merchant role required" });
  }

  const inputSchema = z.object({ storefrontId: z.string().uuid() });
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "storefrontId is required for merchant procedures" });
  }

  const storefront = await ctx.prisma.storefront.findUnique({
    where: { id: parsed.data.storefrontId },
    select: { userId: true }
  });

  if (!storefront || storefront.userId !== ctx.user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this storefront" });
  }

  return next();
});

function withRateLimit(limitName: "advisor" | "analytics" | "auth") {
  return t.middleware(async ({ ctx, next }) => {
    const key = ctx.user?.id ?? ctx.ip;
    const limiter =
      limitName === "advisor" ? advisorRateLimit : limitName === "analytics" ? analyticsRateLimit : authRateLimit;

    const result = await limiter.limit(`${limitName}:${key}`);
    if (!result.success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Rate limit exceeded for ${limitName}` });
    }
    return next();
  });
}

export const protectedProcedure = publicProcedure.use(isAuthenticated);
export const merchantProcedure = protectedProcedure.use(isMerchant);
export const adminProcedure = protectedProcedure.use(isAdmin);
export const advisorProcedure = protectedProcedure.use(withRateLimit("advisor"));
export const analyticsProcedure = publicProcedure.use(withRateLimit("analytics"));
export const authProcedure = publicProcedure.use(withRateLimit("auth"));
