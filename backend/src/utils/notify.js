import { supabaseAdmin } from "../config/supabase.js";
import { sendEmail } from "./email.js";

export async function createNotification(userId, { type, title, body }) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[notification]", error.message);
  }
}

export async function notifyStorefrontOwner(storefrontId, payload) {
  const { data: storefront } = await supabaseAdmin
    .from("storefronts")
    .select("user_id, business_name")
    .eq("id", storefrontId)
    .single();
  if (!storefront?.user_id) return;

  await createNotification(storefront.user_id, payload);

  const { data: profile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", storefront.user_id).single();
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(storefront.user_id);
  const email = authUser?.user?.email;
  if (email) {
    await sendEmail({
      to: email,
      subject: payload.title,
      html: `<p>Hi ${profile?.full_name || "there"},</p><p>${payload.body}</p><p>— KashmirConnect</p>`,
    });
  }
}
