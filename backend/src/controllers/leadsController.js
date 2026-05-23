import { db } from "../config/db.js";
import { checkStorefrontOwnership } from "../utils/checkOwnership.js";
import { notifyStorefrontOwner } from "../utils/notify.js";

export async function createLead(req, res, next) {
  try {
    const { storefront_id, product_id, customer_name, customer_phone, message, source } = req.body;

    const { data: storefront } = await db
      .from("storefronts")
      .select("id, business_name, is_active")
      .eq("id", storefront_id)
      .eq("is_active", true)
      .single();
    if (!storefront) return res.status(404).json({ error: "Storefront not found" });

    const { data, error } = await db
      .from("leads")
      .insert({
        storefront_id,
        product_id: product_id || null,
        customer_name,
        customer_phone,
        message,
        source: source || "inquiry",
      })
      .select("*")
      .single();
    if (error) throw error;

    await notifyStorefrontOwner(storefront_id, {
      type: "new_lead",
      title: "New customer inquiry",
      body: `${customer_name || "Someone"} sent an inquiry${message ? `: ${message.slice(0, 80)}` : ""}.`,
    });

    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

export async function myLeads(req, res, next) {
  try {
    const { data: storefront } = await db.from("storefronts").select("id").eq("user_id", req.userId).maybeSingle();
    if (!storefront) return res.json([]);

    const { data, error } = await db
      .from("leads")
      .select("*, products(name)")
      .eq("storefront_id", storefront.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function updateLeadStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: lead, error: leadError } = await db.from("leads").select("storefront_id").eq("id", id).single();
    if (leadError) throw leadError;

    await checkStorefrontOwnership(lead.storefront_id, req.userId);

    const { data, error } = await db.from("leads").update({ status }).eq("id", id).select("*").single();
    if (error) throw error;

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}
