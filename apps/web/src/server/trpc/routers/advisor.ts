import { z } from "zod";
import { advisorProcedure, createTRPCRouter } from "../init";

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const advisorRouter = createTRPCRouter({
  consume: advisorProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        month: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const month = input.month ?? currentMonth();
      const usage = await ctx.prisma.aIAdvisorUsage.upsert({
        where: { userId_month: { userId: ctx.user.id, month } },
        create: { userId: ctx.user.id, month, count: 1 },
        update: { count: { increment: 1 } }
      });
      return {
        answer: `Advisor acknowledged: ${input.prompt}`,
        month,
        count: usage.count
      };
    }),
  usage: advisorProcedure
    .input(z.object({ month: z.string().optional() }))
    .query(({ ctx, input }) =>
      ctx.prisma.aIAdvisorUsage.findUnique({
        where: { userId_month: { userId: ctx.user.id, month: input.month ?? currentMonth() } }
      })
    )
});
