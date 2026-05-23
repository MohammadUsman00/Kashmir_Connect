import { db } from "../config/db.js";
import { checkStorefrontOwnership } from "../utils/checkOwnership.js";
import { notifyStorefrontOwner } from "../utils/notify.js";

export async function createOrder(req, res, next) {
  try {
    const { storefront_id, product_id, customer_name, customer_phone, quantity, notes } = req.body;

    const { data: storefront } = await db
      .from("storefronts")
      .select("id")
      .eq("id", storefront_id)
      .eq("is_active", true)
      .single();
    if (!storefront) return res.status(404).json({ error: "Storefront not found" });

    const { data, error } = await db
      .from("orders")
      .insert({
        storefront_id,
        product_id: product_id || null,
        customer_name,
        customer_phone,
        quantity: quantity || 1,
        notes,
      })
      .select("*")
      .single();
    if (error) throw error;

    await notifyStorefrontOwner(storefront_id, {
      type: "new_order",
      title: "New order request",
      body: `${customer_name} requested an order (${quantity || 1} item). Phone: ${customer_phone}`,
    });

    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

export async function myOrders(req, res, next) {
  try {
    const { data: storefront } = await db.from("storefronts").select("id").eq("user_id", req.userId).maybeSingle();
    if (!storefront) return res.json([]);

    const { data, error } = await db
      .from("orders")
      .select("*, products(name)")
      .eq("storefront_id", storefront.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: order, error: orderError } = await db.from("orders").select("storefront_id").eq("id", id).single();
    if (orderError) throw orderError;

    await checkStorefrontOwnership(order.storefront_id, req.userId);

    const { data, error } = await db.from("orders").update({ status }).eq("id", id).select("*").single();
    if (error) throw error;

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}
