import type { Prisma, Storefront } from "@prisma/client";
import { prisma } from "../client";

export interface StorefrontFilters {
  sector?: string;
  featured?: boolean;
  verified?: boolean;
  published?: boolean;
  search?: string;
  take?: number;
  skip?: number;
}

export interface IStorefrontRepository {
  findBySlug(slug: string): Promise<Storefront | null>;
  findByUserId(userId: string): Promise<Storefront | null>;
  create(data: Prisma.StorefrontCreateInput): Promise<Storefront>;
  update(id: string, data: Prisma.StorefrontUpdateInput): Promise<Storefront>;
  delete(id: string): Promise<Storefront>;
  findAll(filters: StorefrontFilters): Promise<Storefront[]>;
}

export class StorefrontRepository implements IStorefrontRepository {
  async findBySlug(slug: string): Promise<Storefront | null> {
    return prisma.storefront.findUnique({ where: { slug } });
  }

  async findByUserId(userId: string): Promise<Storefront | null> {
    return prisma.storefront.findUnique({ where: { userId } });
  }

  async create(data: Prisma.StorefrontCreateInput): Promise<Storefront> {
    return prisma.storefront.create({ data });
  }

  async update(id: string, data: Prisma.StorefrontUpdateInput): Promise<Storefront> {
    return prisma.storefront.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Storefront> {
    return prisma.storefront.delete({ where: { id } });
  }

  async findAll(filters: StorefrontFilters): Promise<Storefront[]> {
    return prisma.storefront.findMany({
      where: {
        sector: filters.sector,
        featured: filters.featured,
        verified: filters.verified,
        published: filters.published,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
      take: filters.take,
      skip: filters.skip
    });
  }
}
