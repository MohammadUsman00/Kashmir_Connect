import { z } from "zod";
import { createTRPCRouter, authProcedure, protectedProcedure } from "../init";

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
      return ctx.prisma.user.upsert({
        where: { email: input.email },
        update: { role: input.role },
        create: { email: input.email, role: input.role }
      });
    })
});
