import { apiRequest } from "../lib/http.js";

export function getMyAnalytics() {
  return apiRequest("/analytics/my");
}

export function recordEvent(payload) {
  return apiRequest("/analytics/event", { method: "POST", body: payload });
}
