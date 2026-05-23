import { db } from "../config/db.js";
import { checkProductOwnership, checkStorefrontOwnership } from "../utils/checkOwnership.js";

async function countStorefrontProducts(storefrontId) {
  const { count, error } = await db
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("storefront_id", storefrontId);
  if (error) throw error;
  return count || 0;
}

export async function createProduct(req, res, next) {
  try {
    const { storefront_id } = req.body;
    await checkStorefrontOwnership(storefront_id, req.userId);

    const currentCount = await countStorefrontProducts(storefront_id);
    if (currentCount >= 10) {
      return res.status(403).json({ error: "Free tier supports up to 10 products per storefront" });
    }

    const { data, error } = await db.from("products").insert(req.body).select("*").single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

export async function getStorefrontProducts(req, res, next) {
  try {
    const { storefrontId } = req.params;
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("storefront_id", storefrontId)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    await checkProductOwnership(id, req.userId);
    const { data, error } = await db.from("products").update(req.body).eq("id", id).select("*").single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function uploadProductImage(req, res, next) {
  try {
    const { id } = req.params;
    await checkProductOwnership(id, req.userId);

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const extension = req.file.originalname.split(".").pop() || "png";
    const objectPath = `${id}/product-${Date.now()}.${extension}`;

    const { error: uploadError } = await db.storage.from("product-images").upload(objectPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = db.storage.from("product-images").getPublicUrl(objectPath);
    const { error: updateError } = await db.from("products").update({ image_url: publicData.publicUrl }).eq("id", id);
    if (updateError) throw updateError;

    return res.json({ url: publicData.publicUrl });
  } catch (error) {
    return next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    await checkProductOwnership(id, req.userId);
    const { error } = await db.from("products").delete().eq("id", id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}

export async function reorderProducts(req, res, next) {
  try {
    const { products } = req.body;

    for (const item of products) {
      await checkProductOwnership(item.id, req.userId);
    }

    const updates = products.map((p) =>
      db.from("products").update({ sort_order: p.sort_order }).eq("id", p.id)
    );
    await Promise.all(updates);

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}
