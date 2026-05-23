import { db } from "../config/db.js";
import { checkStorefrontOwnership } from "../utils/checkOwnership.js";
import { notifyStorefrontOwner } from "../utils/notify.js";

export async function createReview(req, res, next) {
  try {
    const { storefront_id, author_name, rating, body } = req.body;

    const { data: storefront } = await db
      .from("storefronts")
      .select("id")
      .eq("id", storefront_id)
      .eq("is_active", true)
      .single();
    if (!storefront) return res.status(404).json({ error: "Storefront not found" });

    const { data, error } = await db
      .from("reviews")
      .insert({ storefront_id, author_name, rating, body, is_approved: false })
      .select("*")
      .single();
    if (error) throw error;

    await notifyStorefrontOwner(storefront_id, {
      type: "new_review",
      title: "New review submitted",
      body: `${author_name} left a ${rating}-star review. Approve it in your dashboard.`,
    });

    return res.status(201).json({ ...data, message: "Thank you! Your review will appear after the business approves it." });
  } catch (error) {
    return next(error);
  }
}

export async function publicReviews(req, res, next) {
  try {
    const { storefrontId } = req.params;
    const { data, error } = await db
      .from("reviews")
      .select("*")
      .eq("storefront_id", storefrontId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function myReviews(req, res, next) {
  try {
    const { data: storefront } = await db.from("storefronts").select("id").eq("user_id", req.userId).maybeSingle();
    if (!storefront) return res.json([]);

    const { data, error } = await db
      .from("reviews")
      .select("*")
      .eq("storefront_id", storefront.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function approveReview(req, res, next) {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    const { data: review, error: reviewError } = await db.from("reviews").select("storefront_id").eq("id", id).single();
    if (reviewError) throw reviewError;

    await checkStorefrontOwnership(review.storefront_id, req.userId);

    const { data, error } = await db.from("reviews").update({ is_approved }).eq("id", id).select("*").single();
    if (error) throw error;

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}
