import crypto from "crypto";
import { db } from "../config/supabase.js";

function getMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function recordEvent(req, res, next) {
  try {
    const { storefront_id, event_type, product_id, referrer } = req.body;
    const ipHash = crypto.createHash("sha256").update(req.ip || "unknown").digest("hex").slice(0, 16);

    const { error } = await db.from("analytics_events").insert({
      storefront_id,
      event_type,
      product_id: product_id || null,
      referrer: referrer || req.headers.referer || null,
      user_agent: req.headers["user-agent"] || null,
      ip_hash: ipHash,
    });
    if (error) throw error;

    return res.json({ recorded: true });
  } catch (error) {
    return next(error);
  }
}

export async function myAnalytics(req, res, next) {
  try {
    const { data: storefront, error: sfError } = await db
      .from("storefronts")
      .select("id")
      .eq("user_id", req.userId)
      .maybeSingle();
    if (sfError) throw sfError;
    if (!storefront) {
      return res.json({
        total_views: 0,
        views_this_month: 0,
        whatsapp_clicks: 0,
        badge_scans: 0,
        top_products: [],
        views_by_day: [],
      });
    }

    const storefrontId = storefront.id;
    const monthStart = getMonthStartIso();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const [
      totalViewsResp,
      viewsThisMonthResp,
      whatsappResp,
      badgeResp,
      topProductsResp,
      dailyViewsResp,
    ] = await Promise.all([
      db
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("storefront_id", storefrontId)
        .eq("event_type", "view"),
      db
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("storefront_id", storefrontId)
        .eq("event_type", "view")
        .gte("created_at", monthStart),
      db
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("storefront_id", storefrontId)
        .eq("event_type", "whatsapp_click"),
      db
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("storefront_id", storefrontId)
        .eq("event_type", "badge_scan"),
      db
        .from("analytics_events")
        .select("product_id, products(name)")
        .eq("storefront_id", storefrontId)
        .eq("event_type", "product_view")
        .not("product_id", "is", null),
      db
        .from("analytics_events")
        .select("created_at")
        .eq("storefront_id", storefrontId)
        .eq("event_type", "view")
        .gte("created_at", thirtyDaysAgo),
    ]);

    const productMap = new Map();
    for (const row of topProductsResp.data || []) {
      const key = row.product_id;
      const prev = productMap.get(key) || { product_id: key, name: row.products?.name || "Unknown", views: 0 };
      prev.views += 1;
      productMap.set(key, prev);
    }

    const dayMap = new Map();
    for (const row of dailyViewsResp.data || []) {
      const day = new Date(row.created_at).toISOString().slice(0, 10);
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    }

    const viewsByDay = [...dayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, views]) => ({ day, views }));

    return res.json({
      total_views: totalViewsResp.count || 0,
      views_this_month: viewsThisMonthResp.count || 0,
      whatsapp_clicks: whatsappResp.count || 0,
      badge_scans: badgeResp.count || 0,
      top_products: [...productMap.values()].sort((a, b) => b.views - a.views).slice(0, 5),
      views_by_day: viewsByDay,
    });
  } catch (error) {
    return next(error);
  }
}
