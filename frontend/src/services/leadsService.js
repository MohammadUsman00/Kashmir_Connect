import { apiRequest } from "../lib/http.js";

export function createLead(payload) {
  return apiRequest("/leads", { method: "POST", body: payload });
}

export function getMyLeads() {
  return apiRequest("/leads/my");
}

export function updateLeadStatus(id, status) {
  return apiRequest(`/leads/${id}`, { method: "PATCH", body: { status } });
}
