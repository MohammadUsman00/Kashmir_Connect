import { apiRequest } from "../lib/http.js";

export function getPlatformStats() {
  return apiRequest("/admin/stats");
}

export function listAdminStorefronts() {
  return apiRequest("/admin/storefronts");
}

export function setStorefrontFeatured(id, isFeatured) {
  return apiRequest(`/admin/storefronts/${id}/featured`, { method: "PATCH", body: { is_featured: isFeatured } });
}
