import { randomUUID } from "crypto";
import { z } from "zod";
import { createTRPCRouter, adminProcedure, merchantProcedure, publicProcedure } from "../init";

export const badgeRouter = createTRPCRouter({
  request: merchantProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.badge.create({
        data: {
          storefrontId: input.storefrontId,
          status: "PENDING",
          code: `KC-${randomUUID().slice(0, 8).toUpperCase()}`
        }
      })
    ),
  byStorefront: publicProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .query(({ ctx, input }) => ctx.prisma.badge.findUnique({ where: { storefrontId: input.storefrontId } })),
  review: adminProcedure
    .input(
      z.object({
        badgeId: z.string().uuid(),
        status: z.enum(["APPROVED", "REJECTED"])
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.badge.update({
        where: { id: input.badgeId },
        data: { status: input.status, reviewedAt: new Date() }
      })
    )
});
