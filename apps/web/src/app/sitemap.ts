import type { MetadataRoute } from "next";
import { prisma } from "@kashmir/db";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kashmirconnect.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const storefronts = await prisma.storefront.findMany({
    where: { published: true },
    select: { slug: true, createdAt: true }
  });

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${SITE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6
    }
  ];

  const storefrontEntries: MetadataRoute.Sitemap = storefronts.map((storefront) => ({
    url: `${SITE_URL}/s/${storefront.slug}`,
    lastModified: storefront.createdAt,
    changeFrequency: "daily" as const,
    priority: 0.8
  }));

  return [...staticEntries, ...storefrontEntries];
}
