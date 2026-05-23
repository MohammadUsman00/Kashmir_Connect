import { apiRequest } from "../lib/http.js";

export function importProductsCsv(storefrontId, csv) {
  return apiRequest("/import/products-csv", { method: "POST", body: { storefront_id: storefrontId, csv } });
}
