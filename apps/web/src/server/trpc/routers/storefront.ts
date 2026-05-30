import { z } from "zod";
import { storefrontCreateSchema, storefrontQuerySchema, storefrontUpdateSchema } from "@kashmir/types";
import { createTRPCRouter, merchantProcedure, protectedProcedure, publicProcedure } from "../init";
import { indexStorefrontById } from "@/lib/search/typesense";

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
  listCursor: publicProcedure
    .input(
      z.object({
        sector: z.string().optional(),
        verified: z.boolean().optional(),
        district: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(["featured", "newest", "rating"]).default("featured"),
        limit: z.number().int().min(1).max(50).default(12),
        cursor: z.string().uuid().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.storefront.findMany({
        where: {
          published: true,
          sector: input.sector,
          verified: input.verified,
          ...(input.district?.trim()
            ? { description: { contains: input.district.trim(), mode: "insensitive" } }
            : {}),
          ...(input.search?.trim()
            ? {
                OR: [
                  { name: { contains: input.search.trim(), mode: "insensitive" } },
                  { description: { contains: input.search.trim(), mode: "insensitive" } },
                  {
                    products: {
                      some: { name: { contains: input.search.trim(), mode: "insensitive" } }
                    }
                  }
                ]
              }
            : {})
        },
        include: {
          products: {
            where: { hidden: false },
            orderBy: { order: "asc" },
            take: 3,
            select: { id: true, name: true, images: true }
          },
          _count: {
            select: { products: true, reviews: true }
          },
          reviews: {
            where: { approved: true },
            select: { rating: true }
          }
        },
        orderBy:
          input.sort === "newest"
            ? [{ createdAt: "desc" }]
            : input.sort === "rating"
              ? [{ verified: "desc" }, { featured: "desc" }, { createdAt: "desc" }]
              : [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
        take: input.limit + 1,
        ...(input.cursor
          ? {
              cursor: { id: input.cursor },
              skip: 1
            }
          : {})
      });

      const hasMore = items.length > input.limit;
      const sliced = hasMore ? items.slice(0, input.limit) : items;
      const nextCursor = hasMore ? sliced[sliced.length - 1]?.id : null;

      const enriched = sliced.map((storefront) => {
        const ratings = storefront.reviews.map((review) => review.rating);
        const avgRating = ratings.length ? ratings.reduce((acc, val) => acc + val, 0) / ratings.length : 0;
        return {
          ...storefront,
          avgRating
        };
      });

      return {
        items: enriched,
        nextCursor
      };
    }),
  create: protectedProcedure
    .input(storefrontCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const storefront = await ctx.storefrontService.create({
        ...input,
        user: { connect: { id: ctx.user.id } }
      });
      await indexStorefrontById(storefront.id).catch(() => undefined);
      return storefront;
    }),
  update: merchantProcedure
    .input(
      z.object({
        storefrontId: z.string().uuid(),
        data: storefrontUpdateSchema
      })
    )
    .mutation(async ({ ctx, input }) => {
      const storefront = await ctx.storefrontService.update(input.storefrontId, input.data);
      await indexStorefrontById(input.storefrontId).catch(() => undefined);
      return storefront;
    }),
  delete: merchantProcedure
    .input(z.object({ storefrontId: z.string().uuid() }))
    .mutation(({ ctx, input }) => {
      return ctx.storefrontService.delete(input.storefrontId);
    })
});
