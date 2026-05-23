import { apiRequest } from "../lib/http.js";

export function requestBadge(payload) {
  return apiRequest("/badges/request", { method: "POST", body: payload });
}

export function getMyBadge() {
  return apiRequest("/badges/my");
}

export function generateBadgeQr(badgeCode) {
  return apiRequest(`/badges/generate-qr/${badgeCode}`, { method: "POST" });
}

export function verifyBadgeByCode(badgeCode) {
  return apiRequest(`/badges/verify/${badgeCode}`);
}

export function listPendingBadges() {
  return apiRequest("/badges/admin/pending");
}

export function adminVerifyBadge(badgeId) {
  return apiRequest(`/badges/admin/verify/${badgeId}`, { method: "PUT" });
}

export function adminRejectBadge(badgeId, reason) {
  return apiRequest(`/badges/admin/reject/${badgeId}`, { method: "PUT", body: { reason } });
}
