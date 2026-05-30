import type { Prisma, Storefront } from "@prisma/client";
import type { IStorefrontRepository, StorefrontFilters } from "../repositories/storefront.repository";

export class StorefrontService {
  constructor(private readonly storefrontRepository: IStorefrontRepository) {}

  async getBySlug(slug: string): Promise<Storefront | null> {
    return this.storefrontRepository.findBySlug(slug);
  }

  async getByUserId(userId: string): Promise<Storefront | null> {
    return this.storefrontRepository.findByUserId(userId);
  }

  async create(data: Prisma.StorefrontCreateInput): Promise<Storefront> {
    return this.storefrontRepository.create(data);
  }

  async update(id: string, data: Prisma.StorefrontUpdateInput): Promise<Storefront> {
    return this.storefrontRepository.update(id, data);
  }

  async delete(id: string): Promise<Storefront> {
    return this.storefrontRepository.delete(id);
  }

  async list(filters: StorefrontFilters): Promise<Storefront[]> {
    return this.storefrontRepository.findAll(filters);
  }
}
