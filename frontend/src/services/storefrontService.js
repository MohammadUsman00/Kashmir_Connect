import { apiRequest } from "../lib/http.js";
import { API_BASE_URL } from "../config/env.js";
import { getToken } from "../state/session.js";

export function createStorefront(payload) {
  return apiRequest("/storefronts", { method: "POST", body: payload });
}

export function getMyStorefront() {
  return apiRequest("/storefronts/my");
}

export function updateStorefront(storefrontId, payload) {
  return apiRequest(`/storefronts/${storefrontId}`, { method: "PUT", body: payload });
}

export async function uploadStorefrontImage(storefrontId, file, kind) {
  const token = getToken();
  const formData = new FormData();
  formData.append(kind, file);

  const response = await fetch(`${API_BASE_URL}/storefronts/${storefrontId}/upload-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || "Failed to upload image");
  return payload;
}

export function getExploreStorefronts(queryString = "") {
  const qs = queryString ? `?${queryString}` : "";
  return apiRequest(`/storefronts/explore${qs}`);
}
