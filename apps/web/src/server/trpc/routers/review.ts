import { z } from "zod";
import { createTRPCRouter, merchantProcedure, publicProcedure } from "../init";

export const reviewRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        authorName: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        body: z.string().optional()
      })
    )
    .mutation(({ ctx, input }) => ctx.prisma.review.create({ data: input })),
  approvedByStorefront: publicProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.review.findMany({
        where: { storefrontId: input.storefrontId, approved: true },
        orderBy: { createdAt: "desc" }
      })
    ),
  approve: merchantProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        reviewId: z.string().uuid(),
        approved: z.boolean()
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.review.updateMany({
        where: { id: input.reviewId, storefrontId: input.storefrontId },
        data: { approved: input.approved }
      })
    )
});
