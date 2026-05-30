import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, merchantProcedure, publicProcedure } from "../init";

export const productRouter = createTRPCRouter({
  byStorefront: publicProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.prisma.product.findMany({
        where: { storefrontId: input.storefrontId, hidden: false },
        orderBy: { order: "asc" }
      })
    ),
  create: merchantProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        name: z.string().min(2),
        description: z.string().optional(),
        price: z.number().nonnegative(),
        stock: z.number().int().nonnegative().optional(),
        images: z.array(z.string().url()),
        order: z.number().int().default(0)
      })
    )
    .mutation(({ ctx, input }) => ctx.prisma.product.create({ data: input })),
  update: merchantProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        productId: z.string().uuid(),
        data: z
          .object({
            name: z.string().min(2).optional(),
            description: z.string().optional(),
            price: z.number().nonnegative().optional(),
            stock: z.number().int().nonnegative().nullable().optional(),
            hidden: z.boolean().optional(),
            images: z.array(z.string().url()).optional(),
            order: z.number().int().optional()
          })
          .refine((v) => Object.keys(v).length > 0)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        select: { storefrontId: true }
      });
      if (!existing || existing.storefrontId !== input.storefrontId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found for storefront" });
      }
      return ctx.prisma.product.update({
        where: { id: input.productId },
        data: input.data
      });
    }),
  delete: merchantProcedure
    .input(z.object({ storefrontId: z.string().uuid(), productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        select: { storefrontId: true }
      });
      if (!existing || existing.storefrontId !== input.storefrontId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found for storefront" });
      }
      return ctx.prisma.product.delete({ where: { id: input.productId } });
    })
});
