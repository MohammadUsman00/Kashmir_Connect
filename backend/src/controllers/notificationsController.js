import { db } from "../config/db.js";

export async function myNotifications(req, res, next) {
  try {
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    const unread = (data || []).filter((n) => !n.read_at).length;
    return res.json({ items: data || [], unread });
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", req.userId)
      .select("*")
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const { error } = await db
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", req.userId)
      .is("read_at", null);
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}
