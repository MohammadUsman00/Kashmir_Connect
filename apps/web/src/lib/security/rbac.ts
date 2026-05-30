import { TRPCError, initTRPC } from "@trpc/server";
import type { TRPCContext } from "@/server/trpc/context";

export type Role = "USER" | "MERCHANT" | "ADMIN";

export type Permission =
  | "storefront:create"
  | "storefront:update:own"
  | "storefront:delete:own"
  | "product:create:own"
  | "product:update:own"
  | "product:delete:own"
  | "badge:request"
  | "badge:approve"
  | "badge:reject"
  | "admin:impersonate"
  | "admin:feature"
  | "admin:stats"
  | "analytics:read:own"
  | "analytics:read:all";

const allPermissions: Permission[] = [
  "storefront:create",
  "storefront:update:own",
  "storefront:delete:own",
  "product:create:own",
  "product:update:own",
  "product:delete:own",
  "badge:request",
  "badge:approve",
  "badge:reject",
  "admin:impersonate",
  "admin:feature",
  "admin:stats",
  "analytics:read:own",
  "analytics:read:all"
];

export const rolePermissions: Record<Role, Permission[]> = {
  USER: ["storefront:create"],
  MERCHANT: [
    "storefront:update:own",
    "storefront:delete:own",
    "product:create:own",
    "product:update:own",
    "product:delete:own",
    "badge:request",
    "analytics:read:own"
  ],
  ADMIN: allPermissions
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

const trpc = initTRPC.context<TRPCContext>().create();

export function requirePermission(permission: Permission) {
  return trpc.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
    }
    if (!hasPermission(ctx.user.role as Role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Permission denied: ${permission}`
      });
    }
    return next();
  });
}
