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
    }),
  mapHeatmaps: analyticsProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(90).default(30)
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const events = await ctx.prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: since },
          metadata: { not: null }
        },
        select: { type: true, metadata: true }
      });

      const touristDensity: Array<{ lng: number; lat: number; weight: number }> = [];
      const emergencyIncidents: Array<{ lng: number; lat: number; weight: number }> = [];
      const businessActivity: Array<{ lng: number; lat: number; weight: number }> = [];

      for (const event of events) {
        const meta = (event.metadata ?? {}) as Record<string, unknown>;
        const lng = typeof meta.lng === "number" ? meta.lng : null;
        const lat = typeof meta.lat === "number" ? meta.lat : null;
        if (lng == null || lat == null) continue;
        const weight = typeof meta.weight === "number" ? meta.weight : 1;

        if (event.type === "VIEW") touristDensity.push({ lng, lat, weight });
        if (event.type === "PRODUCT_VIEW") businessActivity.push({ lng, lat, weight });
        if (event.type === "WHATSAPP_CLICK") emergencyIncidents.push({ lng, lat, weight: weight * 0.8 });
      }

      return { touristDensity, emergencyIncidents, businessActivity };
    })
});
