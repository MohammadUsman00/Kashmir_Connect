import { apiRequest } from "../lib/http.js";

export function getMyNotifications() {
  return apiRequest("/notifications/my");
}

export function markNotificationRead(id) {
  return apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", { method: "POST" });
}
