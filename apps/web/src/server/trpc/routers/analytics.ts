import { z } from "zod";
import { analyticsProcedure, createTRPCRouter, protectedProcedure } from "../init";

export const analyticsRouter = createTRPCRouter({
  track: analyticsProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        type: z.enum(["VIEW", "WHATSAPP_CLICK", "PRODUCT_VIEW"]),
        metadata: z.record(z.any()).optional()
      })
    )
    .mutation(({ ctx, input }) => ctx.prisma.analyticsEvent.create({ data: input })),
  mySummary: protectedProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [views, clicks, productViews] = await Promise.all([
        ctx.prisma.analyticsEvent.count({ where: { storefrontId: input.storefrontId, type: "VIEW" } }),
        ctx.prisma.analyticsEvent.count({ where: { storefrontId: input.storefrontId, type: "WHATSAPP_CLICK" } }),
        ctx.prisma.analyticsEvent.count({ where: { storefrontId: input.storefrontId, type: "PRODUCT_VIEW" } })
      ]);
      return { views, clicks, productViews };
    })
});
