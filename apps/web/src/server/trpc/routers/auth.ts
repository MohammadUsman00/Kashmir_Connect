import { z } from "zod";
import { createTRPCRouter, authProcedure, protectedProcedure } from "../init";
import { trackPosthogEvent } from "@/lib/monitoring/posthog";

export const authRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => ctx.user),
  upsertRole: authProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["MERCHANT", "ADMIN", "USER"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
      const user = await ctx.prisma.user.upsert({
        where: { email: input.email },
        update: { role: input.role },
        create: { email: input.email, role: input.role }
      });
      if (!existing) {
        await trackPosthogEvent(user.id, "signup", { role: user.role });
      }
      return user;
    })
});
