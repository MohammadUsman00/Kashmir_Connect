import { z } from "zod";
import { createTRPCRouter, merchantProcedure, publicProcedure } from "../init";

export const orderRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        customerName: z.string().min(1),
        customerPhone: z.string().min(5),
        customerEmail: z.string().email().optional(),
        items: z.array(z.object({ productId: z.string().uuid(), qty: z.number().int().positive() }))
      })
    )
    .mutation(({ ctx, input }) => ctx.prisma.order.create({ data: input })),
  byStorefront: merchantProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.order.findMany({
        where: { storefrontId: input.storefrontId },
        orderBy: { createdAt: "desc" }
      })
    ),
  setStatus: merchantProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        orderId: z.string().uuid(),
        status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"])
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.order.updateMany({
        where: { id: input.orderId, storefrontId: input.storefrontId },
        data: { status: input.status }
      })
    )
});
