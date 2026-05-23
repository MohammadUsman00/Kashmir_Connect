import { apiRequest } from "../lib/http.js";

export function createOrder(payload) {
  return apiRequest("/orders", { method: "POST", body: payload });
}

export function getMyOrders() {
  return apiRequest("/orders/my");
}

export function updateOrderStatus(id, status) {
  return apiRequest(`/orders/${id}`, { method: "PATCH", body: { status } });
}
