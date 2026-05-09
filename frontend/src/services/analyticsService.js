import { apiRequest } from "../lib/http.js";

export function getMyAnalytics() {
  return apiRequest("/analytics/my");
}
