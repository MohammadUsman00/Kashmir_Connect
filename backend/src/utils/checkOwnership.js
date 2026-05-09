import { supabase } from "../config/supabase.js";

export async function checkStorefrontOwnership(storefrontId, userId) {
  const { data, error } = await supabase
    .from("storefronts")
    .select("id, user_id")
    .eq("id", storefrontId)
    .single();

  if (error || !data) {
    const err = new Error("Storefront not found");
    err.statusCode = 404;
    throw err;
  }

  if (data.user_id !== userId) {
    const err = new Error("Forbidden: you do not own this storefront");
    err.statusCode = 403;
    throw err;
  }

  return data;
}

export async function checkProductOwnership(productId, userId) {
  const { data, error } = await supabase
    .from("products")
    .select("id, storefronts!inner(id, user_id)")
    .eq("id", productId)
    .single();

  if (error || !data) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  const ownerId = data.storefronts?.user_id;
  if (ownerId !== userId) {
    const err = new Error("Forbidden: you do not own this product");
    err.statusCode = 403;
    throw err;
  }

  return data;
}
