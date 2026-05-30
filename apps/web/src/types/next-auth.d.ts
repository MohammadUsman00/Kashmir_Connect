import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "MERCHANT" | "ADMIN" | "USER";
      storefrontId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "MERCHANT" | "ADMIN" | "USER";
    storefrontId?: string | null;
    supabaseAccessToken?: string;
  }
}
