import slugify from "slugify";
import { supabase } from "../config/supabase.js";

function randomSuffix(length = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function generateUniqueSlug(name) {
  const base = slugify(name || "storefront", { lower: true, strict: true, trim: true }).slice(0, 40);
  let slug = base || `shop-${randomSuffix(4)}`;

  for (let i = 0; i < 8; i += 1) {
    const { data, error } = await supabase.from("storefronts").select("id").eq("slug", slug).limit(1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return slug;
    }

    slug = `${base}-${randomSuffix(4)}`.slice(0, 60);
  }

  return `${base}-${Date.now().toString(36)}`.slice(0, 60);
}
