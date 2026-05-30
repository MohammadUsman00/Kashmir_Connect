import { prisma } from "@kashmir/db";
import { Redis as UpstashRedis } from "@upstash/redis";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const cache = UpstashRedis.fromEnv();
const CACHE_TTL_SECONDS = 5 * 60;

type DateRange = {
  from: Date;
  to: Date;
};

type DateRangeKey = `${string}:${string}`;

function rangeKey(range: DateRange): DateRangeKey {
  return `${range.from.toISOString()}:${range.to.toISOString()}`;
}

async function readCache<T>(key: string): Promise<T | null> {
  const value = await cache.get<T>(key);
  return value ?? null;
}

async function writeCache<T>(key: string, value: T): Promise<void> {
  await cache.set(key, value, { ex: CACHE_TTL_SECONDS });
}

function daysBetween(range: DateRange): string[] {
  const days: string[] = [];
  const start = new Date(range.from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.to);
  end.setHours(0, 0, 0, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function previousRange(range: DateRange): DateRange {
  const duration = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.to.getTime() - duration)
  };
}

export async function getHourlyHeatmap(storefrontId: string, days = 7): Promise<number[][]> {
  const key = `analytics:hourlyHeatmap:${storefrontId}:${days}`;
  const cached = await readCache<number[][]>(key);
  if (cached) return cached;

  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const events = await prisma.analyticsEvent.findMany({
    where: {
      storefrontId,
      createdAt: { gte: start },
      type: "VIEW"
    },
    select: { createdAt: true }
  });

  const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const event of events) {
    const date = new Date(event.createdAt);
    const day = date.getDay();
    const hour = date.getHours();
    matrix[day][hour] += 1;
  }

  await writeCache(key, matrix);
  return matrix;
}

export async function getStorefrontAnalytics(storefrontId: string, range: DateRange) {
  const key = `analytics:storefront:${storefrontId}:${rangeKey(range)}`;
  const cached = await readCache<unknown>(key);
  if (cached) return cached;

  const [views, whatsappClicks, productViews, orders, reviews, sourceEvents] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        storefrontId,
        type: "VIEW",
        createdAt: { gte: range.from, lte: range.to }
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        storefrontId,
        type: "WHATSAPP_CLICK",
        createdAt: { gte: range.from, lte: range.to }
      }
    }),
    prisma.analyticsEvent.findMany({
      where: {
        storefrontId,
        type: "PRODUCT_VIEW",
        createdAt: { gte: range.from, lte: range.to }
      },
      select: { createdAt: true, metadata: true }
    }),
    prisma.order.count({
      where: {
        storefrontId,
        createdAt: { gte: range.from, lte: range.to }
      }
    }),
    prisma.review.findMany({
      where: {
        storefrontId,
        approved: true,
        createdAt: { gte: range.from, lte: range.to }
      },
      select: { rating: true, createdAt: true }
    }),
    prisma.analyticsEvent.findMany({
      where: {
        storefrontId,
        createdAt: { gte: range.from, lte: range.to }
      },
      select: { type: true, metadata: true, createdAt: true }
    })
  ]);

  const prev = previousRange(range);
  const previousViews = await prisma.analyticsEvent.count({
    where: {
      storefrontId,
      type: "VIEW",
      createdAt: { gte: prev.from, lte: prev.to }
    }
  });
  const viewChangePct =
    previousViews === 0 ? (views > 0 ? 100 : 0) : ((views - previousViews) / previousViews) * 100;

  const conversionRate = views === 0 ? 0 : (whatsappClicks / views) * 100;

  const dayMap = new Map<string, number>();
  const dayKeys = daysBetween(range);
  for (const day of dayKeys) dayMap.set(day, 0);
  for (const event of sourceEvents.filter((item) => item.type === "VIEW")) {
    const keyDay = new Date(event.createdAt).toISOString().slice(0, 10);
    dayMap.set(keyDay, (dayMap.get(keyDay) ?? 0) + 1);
  }
  const dailyViews = dayKeys.map((day) => ({ day, views: dayMap.get(day) ?? 0 }));

  const productCounts = new Map<string, number>();
  for (const event of productViews) {
    const productId =
      typeof event.metadata === "object" && event.metadata && "productId" in event.metadata
        ? String((event.metadata as Record<string, unknown>).productId)
        : "unknown";
    productCounts.set(productId, (productCounts.get(productId) ?? 0) + 1);
  }
  const productIds = [...productCounts.keys()].filter((id) => id !== "unknown");
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      })
    : [];
  const productPerformance = [...productCounts.entries()]
    .map(([productId, count]) => ({
      productId,
      name: products.find((p) => p.id === productId)?.name ?? "Unknown",
      views: count
    }))
    .sort((a, b) => b.views - a.views);

  const trafficSources = {
    Direct: 0,
    "WhatsApp Share": 0,
    Google: 0,
    "Explore Page": 0
  };
  for (const event of sourceEvents) {
    const source =
      typeof event.metadata === "object" && event.metadata && "source" in event.metadata
        ? String((event.metadata as Record<string, unknown>).source)
        : "Direct";
    if (/whatsapp/i.test(source)) trafficSources["WhatsApp Share"] += 1;
    else if (/google/i.test(source)) trafficSources.Google += 1;
    else if (/explore/i.test(source)) trafficSources["Explore Page"] += 1;
    else trafficSources.Direct += 1;
  }

  const ratings = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length
  }));
  const reviewScore =
    reviews.length === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const conversionFunnel = [
    { stage: "Views", value: views },
    { stage: "WhatsApp Click", value: whatsappClicks },
    { stage: "Order Request", value: orders }
  ];

  const payload = {
    kpis: {
      views,
      viewChangePct,
      whatsappClicks,
      conversionRate,
      orders,
      productViews: productViews.length,
      topProduct: productPerformance[0]?.name ?? "N/A",
      reviewScore
    },
    dailyViews,
    productPerformance,
    trafficSources: Object.entries(trafficSources).map(([name, value]) => ({ name, value })),
    ratingDistribution: ratings,
    conversionFunnel
  };

  await writeCache(key, payload);
  return payload;
}

export async function getDistrictMetrics() {
  const key = "analytics:districtMetrics";
  const cached = await readCache<unknown>(key);
  if (cached) return cached;

  const storefronts = await prisma.storefront.findMany({
    where: { published: true },
    include: {
      _count: { select: { products: true } },
      analytics: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: { type: true }
      }
    }
  });

  const districtMap = new Map<
    string,
    { district: string; merchants: number; touristDensity: number; emergencyIncidents: number }
  >();
  for (const storefront of storefronts) {
    const district =
      (storefront.description?.match(
        /(Srinagar|Anantnag|Baramulla|Kupwara|Pulwama|Budgam|Bandipora|Ganderbal|Kulgam|Shopian|Jammu|Kathua|Udhampur|Rajouri|Poonch|Doda|Ramban|Kishtwar|Reasi|Samba)/i
      )?.[0] as string | undefined) ?? "Srinagar";
    if (!districtMap.has(district)) {
      districtMap.set(district, {
        district,
        merchants: 0,
        touristDensity: 0,
        emergencyIncidents: 0
      });
    }
    const entry = districtMap.get(district)!;
    entry.merchants += 1;
    entry.touristDensity += storefront.analytics.filter((item) => item.type === "VIEW").length;
    entry.emergencyIncidents += storefront.analytics.filter((item) => item.type === "WHATSAPP_CLICK").length;
  }

  const payload = [...districtMap.values()].sort((a, b) => b.merchants - a.merchants);
  await writeCache(key, payload);
  return payload;
}

export async function getPlatformAnalytics(range: DateRange) {
  const key = `analytics:platform:${rangeKey(range)}`;
  const cached = await readCache<unknown>(key);
  if (cached) return cached;

  const [
    storefrontCounts,
    productsCount,
    orders,
    signupsThisWeek,
    advisorQueries,
    districtMetrics,
    dailyUsers,
    viewsByStorefront
  ] = await Promise.all([
    prisma.storefront.groupBy({
      by: ["published"],
      _count: { _all: true }
    }),
    prisma.product.count(),
    prisma.order.findMany({
      where: { createdAt: { gte: range.from, lte: range.to } },
      select: { items: true }
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.aIAdvisorUsage.aggregate({
      _sum: { count: true }
    }),
    getDistrictMetrics(),
    Promise.all(
      Array.from({ length: 30 }, async (_, index) => {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - index);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        const key = `hll:dau:${dayStart.toISOString().slice(0, 10)}`;
        const active = Number((await (cache as unknown as { pfcount: (k: string) => Promise<number> }).pfcount(key)) ?? 0);
        return {
          day: dayStart.toISOString().slice(0, 10),
          users: active
        };
      })
    ),
    prisma.analyticsEvent.groupBy({
      by: ["storefrontId"],
      where: {
        type: "VIEW",
        createdAt: { gte: range.from, lte: range.to }
      },
      _count: { storefrontId: true }
    })
  ]);

  const activeStorefronts = storefrontCounts.find((item) => item.published)?._count._all ?? 0;
  const inactiveStorefronts = storefrontCounts.find((item) => !item.published)?._count._all ?? 0;
  const totalStorefronts = activeStorefronts + inactiveStorefronts;

  const orderValue = orders.reduce((sum, order) => {
    const items = Array.isArray(order.items) ? (order.items as Array<{ price?: number; qty?: number }>) : [];
    const total = items.reduce((acc, item) => acc + (item.price ?? 0) * (item.qty ?? 1), 0);
    return sum + total;
  }, 0);

  const growthRaw = await prisma.storefront.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true }
  });
  let cumulative = totalStorefronts - growthRaw.length;
  const growthMap = new Map<string, number>();
  for (const point of growthRaw) {
    const day = point.createdAt.toISOString().slice(0, 10);
    growthMap.set(day, (growthMap.get(day) ?? 0) + 1);
  }
  const growth = daysBetween(range).map((day) => {
    cumulative += growthMap.get(day) ?? 0;
    return { day, storefronts: cumulative };
  });

  const sectorDistRaw = await prisma.storefront.groupBy({
    by: ["sector"],
    _count: { sector: true }
  });
  const sectorDistribution = sectorDistRaw.map((item) => ({
    name: item.sector,
    value: item._count.sector
  }));

  const storefrontIds = viewsByStorefront.map((item) => item.storefrontId);
  const topStoresMeta = storefrontIds.length
    ? await prisma.storefront.findMany({
        where: { id: { in: storefrontIds } },
        select: { id: true, name: true, slug: true, verified: true }
      })
    : [];
  const topStorefronts = viewsByStorefront
    .map((item) => ({
      storefrontId: item.storefrontId,
      views: item._count.storefrontId,
      ...topStoresMeta.find((meta) => meta.id === item.storefrontId)
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const badges = await prisma.badge.findMany({
    select: { status: true, requestedAt: true, reviewedAt: true }
  });
  const approved = badges.filter((badge) => badge.status === "APPROVED").length;
  const pending = badges.filter((badge) => badge.status === "PENDING").length;
  const rejected = badges.filter((badge) => badge.status === "REJECTED").length;
  const reviewDurations = badges
    .filter((badge) => badge.reviewedAt)
    .map((badge) => badge.reviewedAt!.getTime() - badge.requestedAt.getTime());
  const avgReviewHours =
    reviewDurations.length === 0
      ? 0
      : reviewDurations.reduce((sum, duration) => sum + duration, 0) /
        reviewDurations.length /
        (1000 * 60 * 60);

  const activeUsersToday = Number(
    (await (cache as unknown as { pfcount: (k: string) => Promise<number> }).pfcount(
      `hll:dau:${new Date().toISOString().slice(0, 10)}`
    )) ?? 0
  );

  const payload = {
    kpis: {
      totalStorefronts,
      activeStorefronts,
      inactiveStorefronts,
      productsCount,
      totalOrders: orders.length,
      totalOrderValue: orderValue,
      signupsThisWeek,
      advisorQueries: advisorQueries._sum.count ?? 0,
      activeUsersToday
    },
    growth,
    sectorDistribution,
    districtMetrics,
    dailyActiveUsers: dailyUsers.reverse(),
    topStorefronts,
    badgeMetrics: {
      approved,
      pending,
      rejected,
      approvalRate: badges.length === 0 ? 0 : (approved / badges.length) * 100,
      avgReviewHours
    }
  };

  await writeCache(key, payload);
  return payload;
}

declare global {
  // eslint-disable-next-line no-var
  var __kcAnalyticsQueueInitialized__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __kcAnalyticsWorker__: Worker | undefined;
}

function setupBackgroundRefresh() {
  if (globalThis.__kcAnalyticsQueueInitialized__) return;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return;

  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue("analytics-refresh", { connection });
  void queue.add(
    "refresh",
    {},
    {
      repeat: { every: 5 * 60 * 1000 },
      removeOnComplete: 10,
      removeOnFail: 50
    }
  );

  // no-op refresher: intentionally warms keysets
  const worker = new Worker(
    "analytics-refresh",
    async () => {
      const now = new Date();
      const range: DateRange = {
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: now
      };
      const topStorefront = await prisma.storefront.findFirst({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        select: { id: true }
      });
      if (topStorefront) {
        await getStorefrontAnalytics(topStorefront.id, range);
        await getHourlyHeatmap(topStorefront.id, 7);
      }
      await getPlatformAnalytics(range);
      await getDistrictMetrics();
    },
    { connection }
  );
  globalThis.__kcAnalyticsWorker__ = worker;

  globalThis.__kcAnalyticsQueueInitialized__ = true;
}

setupBackgroundRefresh();
