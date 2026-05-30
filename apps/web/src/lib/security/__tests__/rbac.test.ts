import { describe, expect, it } from "@jest/globals";
import { hasPermission, rolePermissions, requirePermission } from "../rbac";

describe("RBAC", () => {
  it("grants user storefront:create", () => {
    expect(hasPermission("USER", "storefront:create")).toBe(true);
  });

  it("does not grant user admin stats", () => {
    expect(hasPermission("USER", "admin:stats")).toBe(false);
  });

  it("grants admin all permissions", () => {
    for (const permission of rolePermissions.ADMIN) {
      expect(hasPermission("ADMIN", permission)).toBe(true);
    }
  });

  it("requirePermission middleware blocks unauthorized role", async () => {
    const middleware = requirePermission("admin:stats");
    await expect(
      middleware({
        ctx: {
          user: { id: "u1", role: "USER", email: "u@x.com", storefrontId: null },
          prisma: {} as never,
          session: null,
          ip: "127.0.0.1",
          storefrontService: {} as never
        },
        type: "query",
        path: "test",
        getRawInput: async () => ({}),
        meta: undefined,
        next: async () => ({ ok: true, marker: "next", data: undefined })
      } as never)
    ).rejects.toThrow("Permission denied");
  });
});
