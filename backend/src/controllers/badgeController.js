import { supabaseAdmin, db } from "../config/supabase.js";
import { checkStorefrontOwnership } from "../utils/checkOwnership.js";
import { generateQrPngBuffer } from "../utils/qrGenerator.js";
import { createNotification } from "../utils/notify.js";
import { sendEmail } from "../utils/email.js";

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
    const { data, error } = await db.from("badges").select("id").eq("badge_code", code).limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return code;
  }
  return `KC${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function requestBadge(req, res, next) {
  try {
    const { storefront_id, business_type, years_in_business, address, description } = req.body;
    await checkStorefrontOwnership(storefront_id, req.userId);

    const { data: existing } = await db.from("badges").select("id").eq("storefront_id", storefront_id).maybeSingle();
    if (existing) {
      return res.status(400).json({ error: "Badge request already exists for this storefront" });
    }

    const badgeCode = await generateUniqueBadgeCode();

    const { data, error } = await db
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
    const { data: storefront } = await db.from("storefronts").select("id").eq("user_id", req.userId).maybeSingle();
    if (!storefront) {
      return res.json(null);
    }
    const { data, error } = await db.from("badges").select("*").eq("storefront_id", storefront.id).maybeSingle();
    if (error) throw error;
    return res.json(data || null);
  } catch (error) {
    return next(error);
  }
}

export async function verifyBadgePublic(req, res, next) {
  try {
    const { badge_code } = req.params;

    const { data: badge } = await db
      .from("badges")
      .select("*, storefronts!inner(id, business_name, sector, slug)")
      .eq("badge_code", badge_code)
      .maybeSingle();

    if (!badge || badge.status !== "verified") {
      return res.json({ verified: false, message: "Badge not found" });
    }

    await db.from("analytics_events").insert({
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
    const { data: badge, error } = await db.from("badges").select("*").eq("badge_code", badge_code).single();
    if (error) throw error;

    await checkStorefrontOwnership(badge.storefront_id, req.userId);

    const verifyAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
    const verifyUrl = `${verifyAppUrl}/verify/${badge_code}`;
    const qrBuffer = await generateQrPngBuffer(verifyUrl);
    const objectPath = `${badge_code}.png`;

    const { error: uploadError } = await db.storage.from("qr-codes").upload(objectPath, qrBuffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: urlData } = db.storage.from("qr-codes").getPublicUrl(objectPath);
    const { error: updateError } = await db.from("badges").update({ qr_code_url: urlData.publicUrl }).eq("id", badge.id);
    if (updateError) throw updateError;

    return res.json({ qr_code_url: urlData.publicUrl });
  } catch (error) {
    return next(error);
  }
}

export async function listPendingBadges(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("badges")
      .select("id, badge_code, status, created_at, verification_notes, storefronts(id, business_name, sector, district, slug)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw error;

    const items = (data || []).map((row) => {
      let notes = {};
      try {
        notes = row.verification_notes ? JSON.parse(row.verification_notes) : {};
      } catch {
        notes = { raw: row.verification_notes };
      }
      return {
        id: row.id,
        badge_code: row.badge_code,
        status: row.status,
        created_at: row.created_at,
        business_name: row.storefronts?.business_name,
        sector: row.storefronts?.sector,
        district: row.storefronts?.district,
        slug: row.storefronts?.slug,
        verification_notes: notes,
      };
    });

    return res.json({ items });
  } catch (error) {
    return next(error);
  }
}

export async function adminVerifyBadge(req, res, next) {
  try {
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

    const { data: storefront } = await supabaseAdmin
      .from("storefronts")
      .select("user_id, business_name")
      .eq("id", badge.storefront_id)
      .single();

    if (storefront?.user_id) {
      await createNotification(storefront.user_id, {
        type: "badge_verified",
        title: "Badge approved!",
        body: `Your authenticity badge (${badge.badge_code}) is now verified.`,
      });
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(storefront.user_id);
      if (authUser?.user?.email) {
        await sendEmail({
          to: authUser.user.email,
          subject: "Your KashmirConnect badge is verified",
          html: `<p>Congratulations! <strong>${storefront.business_name}</strong> is verified on KashmirConnect.</p>`,
        });
      }
    }

    // eslint-disable-next-line no-console
    console.info(`[admin-verify] user=${req.userId} badge=${badge_id} storefront=${badge.storefront_id}`);

    return res.json({ success: true, badge });
  } catch (error) {
    return next(error);
  }
}

export async function adminRejectBadge(req, res, next) {
  try {
    const { badge_id } = req.params;
    const { reason } = req.body;

    const { data: badge, error: badgeError } = await supabaseAdmin
      .from("badges")
      .update({
        status: "rejected",
        verification_notes: JSON.stringify({ rejection_reason: reason || "Did not meet verification criteria" }),
      })
      .eq("id", badge_id)
      .select("*, storefronts(user_id, business_name)")
      .single();
    if (badgeError) throw badgeError;

    const userId = badge.storefronts?.user_id;
    if (userId) {
      await createNotification(userId, {
        type: "badge_rejected",
        title: "Badge application needs changes",
        body: reason || "Please review your application and submit again.",
      });
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user?.email) {
        await sendEmail({
          to: authUser.user.email,
          subject: "KashmirConnect badge update",
          html: `<p>Your badge application for <strong>${badge.storefronts?.business_name}</strong> needs changes.</p><p>${reason || ""}</p>`,
        });
      }
    }

    return res.json({ success: true, badge });
  } catch (error) {
    return next(error);
  }
}
