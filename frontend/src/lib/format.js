export function formatInr(value) {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
}

export function uniqueCategories(products = []) {
  return [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
}
