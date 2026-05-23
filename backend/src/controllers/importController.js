import { db } from "../config/db.js";
import { checkStorefrontOwnership } from "../utils/checkOwnership.js";

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

export async function importProductsCsv(req, res, next) {
  try {
    const { storefront_id, csv } = req.body;
    await checkStorefrontOwnership(storefront_id, req.userId);

    const lines = String(csv || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      return res.status(400).json({ error: "CSV must have a header row and at least one product" });
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const nameIdx = headers.indexOf("name");
    if (nameIdx === -1) return res.status(400).json({ error: "CSV must include a 'name' column" });

    const descIdx = headers.indexOf("description");
    const priceIdx = headers.indexOf("price");
    const unitIdx = headers.indexOf("price_unit");
    const catIdx = headers.indexOf("category");
    const stockIdx = headers.indexOf("stock_count");

    const { count } = await db
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("storefront_id", storefront_id);
    const existing = count || 0;

    const rows = lines.slice(1);
    if (existing + rows.length > 10) {
      return res.status(403).json({ error: "Import would exceed free limit of 10 products per storefront" });
    }

    const inserts = rows.map((line, index) => {
      const cols = parseCsvLine(line);
      const payload = {
        storefront_id,
        name: cols[nameIdx],
        sort_order: existing + index,
      };
      if (descIdx >= 0 && cols[descIdx]) payload.description = cols[descIdx];
      if (priceIdx >= 0 && cols[priceIdx]) payload.price = Number(cols[priceIdx]);
      if (unitIdx >= 0 && cols[unitIdx]) payload.price_unit = cols[unitIdx];
      if (catIdx >= 0 && cols[catIdx]) payload.category = cols[catIdx];
      if (stockIdx >= 0 && cols[stockIdx]) payload.stock_count = Number(cols[stockIdx]);
      return payload;
    });

    const { data, error } = await db.from("products").insert(inserts).select("*");
    if (error) throw error;

    return res.status(201).json({ imported: data?.length || 0, products: data });
  } catch (error) {
    return next(error);
  }
}
