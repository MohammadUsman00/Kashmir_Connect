import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

export const communityNotificationsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.prisma.notification.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 80
    });
    return {
      notifications,
      unread: notifications.filter((item) => !item.read).length
    };
  }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.user.id, read: false },
      data: { read: true }
    });
    return { success: true };
  }),
  setPreferences: protectedProcedure
    .input(
      z.object({
        postReplies: z.boolean(),
        districtPosts: z.boolean(),
        rsvpConfirmations: z.boolean(),
        jobMatches: z.boolean()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { profile: true }
      });
      const profile = (user?.profile ?? {}) as Record<string, unknown>;
      profile.notificationPreferences = input;
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { profile }
      });
      return { success: true };
    })
});
