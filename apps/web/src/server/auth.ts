import { SupabaseAdapter } from "@auth/supabase-adapter";
import { prisma } from "@kashmir/db";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!
  }),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Supabase Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error || !data.user) return null;

        const dbUser = await prisma.user.upsert({
          where: { email: data.user.email! },
          update: {},
          create: {
            id: data.user.id,
            email: data.user.email!,
            role: "USER"
          },
          select: { id: true, email: true, role: true }
        });

        return {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            email: true,
            role: true,
            storefront: { select: { id: true } }
          }
        });

        if (dbUser) {
          token.sub = dbUser.id;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.storefrontId = dbUser.storefront?.id ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? "";
        session.user.role = (token.role as "MERCHANT" | "ADMIN" | "USER") ?? "USER";
        session.user.storefrontId = (token.storefrontId as string | null) ?? null;
      }
      return session;
    }
  },
  events: {
    async signOut({ token }) {
      const accessToken = token?.supabaseAccessToken as string | undefined;
      if (accessToken) {
        await supabaseAdmin.auth.admin.signOut(accessToken);
      }
    }
  }
});
