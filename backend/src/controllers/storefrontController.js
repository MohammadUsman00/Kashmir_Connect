import { supabase } from "../config/supabase.js";
import { checkStorefrontOwnership } from "../utils/checkOwnership.js";
import { generateQrPngBuffer } from "../utils/qrGenerator.js";
import { generateUniqueSlug } from "../utils/slugGenerator.js";

function buildPublicStorefrontUrl(slug) {
  return `kashmirconnect.in/s/${slug}`;
}

export async function createStorefront(req, res, next) {
  try {
    const slug = await generateUniqueSlug(req.body.business_name);

    const { data, error } = await supabase
      .from("storefronts")
      .insert({
        ...req.body,
        user_id: req.userId,
        slug,
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      ...data,
      public_url: buildPublicStorefrontUrl(data.slug),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMyStorefront(req, res, next) {
  try {
    const { data: storefront, error } = await supabase
      .from("storefronts")
      .select("*")
      .eq("user_id", req.userId)
      .maybeSingle();
    if (error) throw error;

    if (!storefront) {
      return res.json({ storefront: null, products: [], badge: null });
    }

    const [{ data: products }, { data: badge }] = await Promise.all([
      supabase.from("products").select("*").eq("storefront_id", storefront.id).order("sort_order", { ascending: true }),
      supabase.from("badges").select("*").eq("storefront_id", storefront.id).maybeSingle(),
    ]);

    return res.json({
      storefront: {
        ...storefront,
        public_url: buildPublicStorefrontUrl(storefront.slug),
      },
      products: products || [],
      badge: badge || null,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getPublicStorefront(req, res, next) {
  try {
    const { slug } = req.params;
    const { data: storefront, error } = await supabase
      .from("storefronts")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) throw error;

    const [{ data: products }, { data: badge }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("storefront_id", storefront.id)
        .eq("is_available", true)
        .order("sort_order", { ascending: true }),
      supabase.from("badges").select("*").eq("storefront_id", storefront.id).eq("status", "verified").maybeSingle(),
    ]);

    await Promise.all([
      supabase.from("storefronts").update({ view_count: (storefront.view_count || 0) + 1 }).eq("id", storefront.id),
      supabase.from("analytics_events").insert({
        storefront_id: storefront.id,
        event_type: "view",
        referrer: req.headers.referer || null,
        user_agent: req.headers["user-agent"] || null,
      }),
    ]);

    return res.json({
      storefront: {
        ...storefront,
        public_url: buildPublicStorefrontUrl(storefront.slug),
      },
      products: products || [],
      badge: badge || null,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateStorefront(req, res, next) {
  try {
    const { id } = req.params;
    await checkStorefrontOwnership(id, req.userId);

    const { data, error } = await supabase
      .from("storefronts")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function uploadStorefrontImage(req, res, next) {
  try {
    const { id } = req.params;
    await checkStorefrontOwnership(id, req.userId);

    const coverFile = req.files?.cover?.[0];
    const logoFile = req.files?.logo?.[0];
    const chosenFile = logoFile || coverFile;
    if (!chosenFile) {
      return res.status(400).json({ error: "Upload either 'cover' or 'logo' image field" });
    }

    const field = logoFile ? "logo_url" : "cover_image_url";
    const extension = chosenFile.originalname.split(".").pop() || "png";
    const objectPath = `${id}/${field}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("storefront-images").upload(objectPath, chosenFile.buffer, {
      contentType: chosenFile.mimetype,
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from("storefront-images").getPublicUrl(objectPath);

    const { error: updateError } = await supabase.from("storefronts").update({ [field]: publicData.publicUrl }).eq("id", id);
    if (updateError) throw updateError;

    return res.json({ url: publicData.publicUrl });
  } catch (error) {
    return next(error);
  }
}

export async function generateStorefrontShareQr(req, res, next) {
  try {
    const { id } = req.params;
    await checkStorefrontOwnership(id, req.userId);

    const { data: storefront, error: sfError } = await supabase
      .from("storefronts")
      .select("slug")
      .eq("id", id)
      .single();
    if (sfError) throw sfError;

    const appUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
    const shareUrl = `${appUrl}/s/${storefront.slug}`;
    const qrBuffer = await generateQrPngBuffer(shareUrl);
    const objectPath = `storefront-${storefront.slug}.png`;

    const { error: uploadError } = await supabase.storage.from("qr-codes").upload(objectPath, qrBuffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("qr-codes").getPublicUrl(objectPath);
    return res.json({ qr_code_url: urlData.publicUrl, share_url: shareUrl });
  } catch (error) {
    return next(error);
  }
}

export async function deleteStorefront(req, res, next) {
  try {
    const { id } = req.params;
    await checkStorefrontOwnership(id, req.userId);

    const { error } = await supabase
      .from("storefronts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}

export async function exploreStorefronts(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 12), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("storefronts")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .eq("is_verified", true)
      .range(from, to)
      .order("created_at", { ascending: false });

    if (req.query.sector) {
      query = query.eq("sector", req.query.sector);
    }
    if (req.query.district) {
      query = query.eq("district", req.query.district);
    }
    if (req.query.search) {
      query = query.or(`business_name.ilike.%${req.query.search}%,description.ilike.%${req.query.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({
      page,
      limit,
      total: count || 0,
      items: (data || []).map((item) => ({
        ...item,
        public_url: buildPublicStorefrontUrl(item.slug),
      })),
    });
  } catch (error) {
    return next(error);
  }
}
