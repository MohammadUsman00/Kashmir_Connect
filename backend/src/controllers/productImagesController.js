import { db } from "../config/db.js";
import { checkProductOwnership } from "../utils/checkOwnership.js";

export async function listProductImages(req, res, next) {
  try {
    const { productId } = req.params;
    await checkProductOwnership(productId, req.userId);

    const { data, error } = await db
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });
    if (error) throw error;

    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

export async function uploadProductGalleryImage(req, res, next) {
  try {
    const { productId } = req.params;
    await checkProductOwnership(productId, req.userId);

    if (!req.file) return res.status(400).json({ error: "Image file is required" });

    const extension = req.file.originalname.split(".").pop() || "png";
    const objectPath = `${productId}/gallery-${Date.now()}.${extension}`;

    const { error: uploadError } = await db.storage.from("product-images").upload(objectPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = db.storage.from("product-images").getPublicUrl(objectPath);

    const { count } = await db
      .from("product_images")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId);

    const { data, error } = await db
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: publicData.publicUrl,
        sort_order: count || 0,
      })
      .select("*")
      .single();
    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

export async function deleteProductGalleryImage(req, res, next) {
  try {
    const { productId, imageId } = req.params;
    await checkProductOwnership(productId, req.userId);

    const { error } = await db.from("product_images").delete().eq("id", imageId).eq("product_id", productId);
    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}
