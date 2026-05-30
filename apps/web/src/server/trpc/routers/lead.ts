import { z } from "zod";
import { createTRPCRouter, merchantProcedure, publicProcedure } from "../init";

export const leadRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        name: z.string().optional(),
        phone: z.string().optional(),
        message: z.string().optional()
      })
    )
    .mutation(({ ctx, input }) => ctx.prisma.lead.create({ data: input })),
  byStorefront: merchantProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.lead.findMany({
        where: { storefrontId: input.storefrontId },
        orderBy: { createdAt: "desc" }
      })
    )
});
