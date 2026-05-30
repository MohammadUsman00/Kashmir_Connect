import { z } from "zod";
import { storefrontCreateSchema, storefrontQuerySchema, storefrontUpdateSchema } from "@kashmir/types";
import { createTRPCRouter, merchantProcedure, protectedProcedure, publicProcedure } from "../init";

export const storefrontRouter = createTRPCRouter({
  bySlug: publicProcedure.input(z.object({ slug: z.string().min(3) })).query(({ ctx, input }) => {
    return ctx.storefrontService.getBySlug(input.slug);
  }),
  mine: protectedProcedure.query(({ ctx }) => {
    return ctx.storefrontService.getByUserId(ctx.user.id);
  }),
  list: publicProcedure.input(storefrontQuerySchema).query(({ ctx, input }) => {
    return ctx.storefrontService.list(input);
  }),
  create: protectedProcedure
    .input(storefrontCreateSchema)
    .mutation(({ ctx, input }) => {
      return ctx.storefrontService.create({
        ...input,
        user: { connect: { id: ctx.user.id } }
      });
    }),
  update: merchantProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        data: storefrontUpdateSchema
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.storefrontService.update(input.storefrontId, input.data);
    }),
  delete: merchantProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      return ctx.storefrontService.delete(input.storefrontId);
    })
});
