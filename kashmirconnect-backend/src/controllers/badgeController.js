import { supabase, supabaseAdmin } from "../config/supabase.js";
import { checkStorefrontOwnership } from "../utils/checkOwnership.js";
import { generateQrPngBuffer } from "../utils/qrGenerator.js";

function randomBadgeCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "KC";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateUniqueBadgeCode() {
  for (let i = 0; i < 15; i += 1) {
    const code = randomBadgeCode();
    const { data, error } = await supabase.from("badges").select("id").eq("badge_code", code).limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return code;
  }
  return `KC${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function requestBadge(req, res, next) {
  try {
    const { storefront_id, business_type, years_in_business, address, description } = req.body;
    await checkStorefrontOwnership(storefront_id, req.userId);

    const { data: existing } = await supabase.from("badges").select("id").eq("storefront_id", storefront_id).maybeSingle();
    if (existing) {
      return res.status(400).json({ error: "Badge request already exists for this storefront" });
    }

    const badgeCode = await generateUniqueBadgeCode();

    const { data, error } = await supabase
      .from("badges")
      .insert({
        storefront_id,
        badge_code: badgeCode,
        status: "pending",
        verification_notes: JSON.stringify({
          business_type,
          years_in_business,
          address,
          description,
        }),
      })
      .select("id, badge_code, status")
      .single();
    if (error) throw error;

    return res.status(201).json({
      badge_id: data.id,
      badge_code: data.badge_code,
      status: data.status,
    });
  } catch (error) {
    return next(error);
  }
}

export async function myBadge(req, res, next) {
  try {
    const { data: storefront } = await supabase.from("storefronts").select("id").eq("user_id", req.userId).maybeSingle();
    if (!storefront) {
      return res.json(null);
    }
    const { data, error } = await supabase.from("badges").select("*").eq("storefront_id", storefront.id).maybeSingle();
    if (error) throw error;
    return res.json(data || null);
  } catch (error) {
    return next(error);
  }
}

export async function verifyBadgePublic(req, res, next) {
  try {
    const { badge_code } = req.params;

    const { data: badge } = await supabase
      .from("badges")
      .select("*, storefronts!inner(id, business_name, sector, slug)")
      .eq("badge_code", badge_code)
      .maybeSingle();

    if (!badge || badge.status !== "verified") {
      return res.json({ verified: false, message: "Badge not found" });
    }

    await supabase.from("analytics_events").insert({
      storefront_id: badge.storefronts.id,
      event_type: "badge_scan",
      referrer: req.headers.referer || null,
      user_agent: req.headers["user-agent"] || null,
    });

    return res.json({
      verified: true,
      business_name: badge.storefronts.business_name,
      sector: badge.storefronts.sector,
      badge_code: badge.badge_code,
      verified_at: badge.verified_at,
      storefront_url: `kashmirconnect.in/s/${badge.storefronts.slug}`,
    });
  } catch (error) {
    return next(error);
  }
}

export async function generateBadgeQr(req, res, next) {
  try {
    const { badge_code } = req.params;
    const { data: badge, error } = await supabase.from("badges").select("*").eq("badge_code", badge_code).single();
    if (error) throw error;

    await checkStorefrontOwnership(badge.storefront_id, req.userId);

    const verifyUrl = `${process.env.APP_URL || "http://localhost:5173"}/verify/${badge_code}`;
    const qrBuffer = await generateQrPngBuffer(verifyUrl);
    const objectPath = `${badge_code}.png`;

    const { error: uploadError } = await supabase.storage.from("qr-codes").upload(objectPath, qrBuffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("qr-codes").getPublicUrl(objectPath);
    const { error: updateError } = await supabase.from("badges").update({ qr_code_url: urlData.publicUrl }).eq("id", badge.id);
    if (updateError) throw updateError;

    return res.json({ qr_code_url: urlData.publicUrl });
  } catch (error) {
    return next(error);
  }
}

export async function adminVerifyBadge(req, res, next) {
  try {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || req.headers["x-admin-key"] !== adminKey) {
      return res.status(403).json({ error: "Forbidden: admin key missing or invalid" });
    }

    const { badge_id } = req.params;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(now.getFullYear() + 1);

    const { data: badge, error: badgeError } = await supabaseAdmin
      .from("badges")
      .update({
        status: "verified",
        verified_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", badge_id)
      .select("*")
      .single();
    if (badgeError) throw badgeError;

    const { error: storefrontError } = await supabaseAdmin
      .from("storefronts")
      .update({ is_verified: true })
      .eq("id", badge.storefront_id);
    if (storefrontError) throw storefrontError;

    return res.json({ success: true, badge });
  } catch (error) {
    return next(error);
  }
}
