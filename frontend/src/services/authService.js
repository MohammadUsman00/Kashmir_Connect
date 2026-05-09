import { apiRequest } from "../lib/http.js";
import { clearSession, setToken, setUser } from "../state/session.js";

export async function register(payload) {
  const data = await apiRequest("/auth/register", { method: "POST", body: payload });
  const accessToken = data?.session?.access_token;
  if (accessToken) setToken(accessToken);
  if (data?.user) setUser(data.user);
  return data;
}

export async function login(payload) {
  const data = await apiRequest("/auth/login", { method: "POST", body: payload });
  const accessToken = data?.session?.access_token;
  if (accessToken) setToken(accessToken);
  if (data?.user) setUser(data.user);
  return data;
}

export async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

export async function getMe() {
  return apiRequest("/auth/me");
}

export async function updateProfile(payload) {
  return apiRequest("/auth/profile", { method: "PUT", body: payload });
}
