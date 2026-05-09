import { supabase } from "../config/supabase.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Missing or invalid authorization token" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = data.user;
    req.userId = data.user.id;
    req.accessToken = token;

    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAdmin(req, res, next) {
  const role = req.user?.app_metadata?.role || req.user?.user_metadata?.role;
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin role required" });
  }
  return next();
}
