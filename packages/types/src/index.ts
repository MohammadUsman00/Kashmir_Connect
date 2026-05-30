import { z } from "zod";

export const roleSchema = z.enum(["MERCHANT", "ADMIN", "USER"]);
export type Role = z.infer<typeof roleSchema>;

export const orderStatusSchema = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);
export const badgeStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const analyticsEventTypeSchema = z.enum(["VIEW", "WHATSAPP_CLICK", "PRODUCT_VIEW"]);

export const storefrontCreateSchema = z.object({
  slug: z.string().min(3),
  name: z.string().min(2),
  description: z.string().optional(),
  sector: z.string().min(2),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  coverUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  whatsapp: z.string().optional()
});

export const storefrontUpdateSchema = storefrontCreateSchema.partial();
export const storefrontQuerySchema = z.object({
  sector: z.string().optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  published: z.boolean().optional(),
  search: z.string().optional(),
  take: z.number().int().positive().max(100).optional(),
  skip: z.number().int().min(0).optional()
});
