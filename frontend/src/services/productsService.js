import { apiRequest } from "../lib/http.js";
import { API_BASE_URL } from "../config/env.js";
import { getToken } from "../state/session.js";

export function createProduct(payload) {
  return apiRequest("/products", { method: "POST", body: payload });
}

export function updateProduct(productId, payload) {
  return apiRequest(`/products/${productId}`, { method: "PUT", body: payload });
}

export function deleteProduct(productId) {
  return apiRequest(`/products/${productId}`, { method: "DELETE" });
}

export function reorderProducts(products) {
  return apiRequest("/products/reorder", { method: "PUT", body: { products } });
}

export function importProductsCsv(storefrontId, csv) {
  return apiRequest("/import/products-csv", { method: "POST", body: { storefront_id: storefrontId, csv } });
}

export async function uploadProductGalleryImage(productId, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch(`${API_BASE_URL}/products/${productId}/gallery`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || "Gallery upload failed");
  return payload;
}

export async function uploadProductImage(productId, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/products/${productId}/upload-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || "Failed to upload product image");
  return payload;
}
