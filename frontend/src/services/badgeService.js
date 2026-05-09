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
