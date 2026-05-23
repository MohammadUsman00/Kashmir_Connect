import { supabaseAdmin } from "../config/supabase.js";

export async function listStorefronts(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("storefronts")
      .select("id, business_name, slug, sector, district, is_active, is_verified, is_featured, view_count, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return res.json({ items: data || [] });
  } catch (error) {
    return next(error);
  }
}

export async function setFeatured(req, res, next) {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    const { data, error } = await supabaseAdmin
      .from("storefronts")
      .update({ is_featured: Boolean(is_featured) })
      .eq("id", id)
      .select("id, business_name, is_featured")
      .single();
    if (error) throw error;

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function platformStats(req, res, next) {
  try {
    const [storefronts, products, leads, orders, badges] = await Promise.all([
      supabaseAdmin.from("storefronts").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("leads").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("badges").select("*", { count: "exact", head: true }).eq("status", "verified"),
    ]);

    return res.json({
      storefronts: storefronts.count || 0,
      products: products.count || 0,
      leads: leads.count || 0,
      orders: orders.count || 0,
      verified_badges: badges.count || 0,
    });
  } catch (error) {
    return next(error);
  }
}
