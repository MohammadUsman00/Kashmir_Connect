import { supabase } from "../config/supabase.js";

async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function register(req, res, next) {
  try {
    const { email, password, full_name, phone, business_name, sector, district } = req.body;

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) {
      throw new Error("Registration failed");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name,
        phone,
        business_name,
        sector,
        district,
      })
      .select("*")
      .single();

    if (profileError) throw profileError;

    return res.status(201).json({
      user: authData.user,
      session: authData.session,
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const profile = await fetchProfile(data.user.id);

    return res.json({
      user: data.user,
      session: data.session,
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const { error } = await supabase.auth.signOut(req.accessToken ? { scope: "global" } : undefined);
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const profile = await fetchProfile(req.userId);

    const { data: storefront } = await supabase
      .from("storefronts")
      .select("id, slug, business_name, is_active, is_verified, created_at")
      .eq("user_id", req.userId)
      .maybeSingle();

    const role = req.user?.app_metadata?.role || req.user?.user_metadata?.role || "user";

    return res.json({ ...profile, role, storefront });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const payload = { ...req.body, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", req.userId)
      .select("*")
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}
