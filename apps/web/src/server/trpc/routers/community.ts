import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";
import { getEmergencySocketServer } from "@/lib/emergency/socket";

export const communityRouter = createTRPCRouter({
  feed: publicProcedure
    .input(
      z.object({
        district: z.string().optional(),
        type: z.enum(["ANNOUNCEMENT", "EVENT", "LOST_FOUND", "VOLUNTEER", "DISCUSSION"]).optional()
      })
    )
    .query(({ ctx, input }) =>
      ctx.prisma.post.findMany({
        where: { district: input.district, type: input.type },
        include: {
          author: { select: { email: true } },
          event: true,
          lostFound: true,
          volunteer: true
        },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 120
      })
    ),
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["ANNOUNCEMENT", "EVENT", "LOST_FOUND", "VOLUNTEER", "DISCUSSION"]),
        title: z.string().min(2),
        body: z.string().min(2),
        images: z.array(z.string().url()).max(5).default([]),
        district: z.string(),
        tehsil: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: {
          authorId: ctx.user.id,
          ...input
        }
      });
      const io = getEmergencySocketServer();
      io?.to(`district-${post.district}`).emit("community:post:new", post);
      return post;
    }),
  upvote: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.postVote.findUnique({
        where: { postId_userId: { postId: input.postId, userId: ctx.user.id } }
      });

      if (existing) {
        await ctx.prisma.postVote.delete({
          where: { postId_userId: { postId: input.postId, userId: ctx.user.id } }
        });
        const post = await ctx.prisma.post.update({
          where: { id: input.postId },
          data: { upvotes: { decrement: 1 } },
          select: { id: true, upvotes: true }
        });
        getEmergencySocketServer()?.emit("community:post:upvote", { postId: post.id, upvotes: post.upvotes });
        return post;
      }

      await ctx.prisma.postVote.create({
        data: { postId: input.postId, userId: ctx.user.id }
      });
      const post = await ctx.prisma.post.update({
        where: { id: input.postId },
        data: { upvotes: { increment: 1 } },
        select: { id: true, upvotes: true }
      });
      getEmergencySocketServer()?.emit("community:post:upvote", { postId: post.id, upvotes: post.upvotes });
      return post;
    })
});
