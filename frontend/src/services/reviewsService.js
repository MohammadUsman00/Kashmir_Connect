import { apiRequest } from "../lib/http.js";

export function createReview(payload) {
  return apiRequest("/reviews", { method: "POST", body: payload });
}

export function getMyReviews() {
  return apiRequest("/reviews/my");
}

export function approveReview(id, isApproved) {
  return apiRequest(`/reviews/${id}`, { method: "PATCH", body: { is_approved: isApproved } });
}
