import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";

export const studentsRouter = createTRPCRouter({
  notes: publicProcedure
    .input(
      z.object({
        subject: z.string().optional(),
        university: z.string().optional(),
        class: z.string().optional()
      })
    )
    .query(({ ctx, input }) =>
      ctx.prisma.note.findMany({
        where: {
          subject: input.subject ? { contains: input.subject, mode: "insensitive" } : undefined,
          university: input.university ? { contains: input.university, mode: "insensitive" } : undefined,
          class: input.class ? { contains: input.class, mode: "insensitive" } : undefined
        },
        include: { author: { select: { email: true } } },
        orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
        take: 120
      })
    ),
  createNote: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(2),
        class: z.string().min(1),
        university: z.string().min(2),
        fileUrl: z.string().url(),
        ocrText: z.string().optional()
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.note.create({
        data: {
          authorId: ctx.user.id,
          ...input
        }
      })
    ),
  listings: publicProcedure
    .input(
      z.object({
        listingType: z.enum(["INTERNSHIP", "JOB"]).optional(),
        location: z.string().optional(),
        preferLocal: z.boolean().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.listingType === "INTERNSHIP") {
        return {
          internships: await ctx.prisma.internship.findMany({
            where: { location: input.location ? { contains: input.location, mode: "insensitive" } : undefined },
            orderBy: { createdAt: "desc" },
            take: 100
          }),
          jobs: []
        };
      }
      if (input.listingType === "JOB") {
        return {
          internships: [],
          jobs: await ctx.prisma.job.findMany({
            where: {
              location: input.location ? { contains: input.location, mode: "insensitive" } : undefined,
              preferLocal: input.preferLocal
            },
            orderBy: { createdAt: "desc" },
            take: 100
          })
        };
      }
      return {
        internships: await ctx.prisma.internship.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
        jobs: await ctx.prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
      };
    })
});
