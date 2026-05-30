import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../init";

export const adminRouter = createTRPCRouter({
  stats: adminProcedure.query(async ({ ctx }) => {
    const [users, storefronts, products, leads, orders] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.storefront.count(),
      ctx.prisma.product.count(),
      ctx.prisma.lead.count(),
      ctx.prisma.order.count()
    ]);

    return { users, storefronts, products, leads, orders };
  }),
  featureStorefront: adminProcedure
    .input(z.object({ storefrontId: z.string().uuid(), featured: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.storefront.update({
        where: { id: input.storefrontId },
        data: { featured: input.featured }
      })
    ),
  setUserRole: adminProcedure
    .input(z.object({ userId: z.string().uuid(), role: z.enum(["MERCHANT", "ADMIN", "USER"]) }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role }
      })
    )
});
