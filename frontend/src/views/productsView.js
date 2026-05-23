import { escapeHtml } from "../lib/escape.js";
import { formatInr } from "../lib/format.js";

export function renderProductsView(storefront, products = []) {
  if (!storefront?.id) {
    return `<section class="panel"><h2>Products</h2><p>Create a storefront first.</p></section>`;
  }

  const sorted = [...products].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return `
    <section class="panel">
      <span class="section-label">Catalog</span>
      <h2>Products <span class="chip">${sorted.length} / 10</span></h2>
      <p class="hint">Use ↑ ↓ to reorder. Edit or hide products from your public page.</p>
      <form id="create-product-form" class="form-grid" data-storefront-id="${escapeHtml(storefront.id)}">
        <input required name="name" type="text" placeholder="Product name" />
        <textarea name="description" rows="2" placeholder="Description"></textarea>
        <input name="price" type="number" min="0" step="0.01" placeholder="Price (INR)" />
        <input name="price_unit" type="text" placeholder="Price unit (piece, kg, etc)" />
        <input name="category" type="text" placeholder="Category (e.g. Shawls)" />
        <input name="stock_count" type="number" min="0" placeholder="Stock count (optional)" />
        <button class="btn">Add product</button>
      </form>
      <details style="margin:1rem 0">
        <summary class="hint" style="cursor:pointer">Bulk import CSV</summary>
        <p class="hint">Columns: name, description, price, price_unit, category, stock_count</p>
        <textarea id="products-csv" rows="4" placeholder="name,description,price,price_unit,category&#10;Pashmina Shawl,Soft shawl,4500,piece,Shawls"></textarea>
        <button type="button" id="import-csv-btn" class="btn btn-outline">Import CSV</button>
      </details>
      <div class="list">
        ${sorted
          .map(
            (p, index) => `
          <article class="list-item product-row ${p.is_available === false ? "product-hidden" : ""}" data-product-id="${escapeHtml(p.id)}">
            <div class="product-thumb">
              ${
                p.image_url
                  ? `<img src="${escapeHtml(p.image_url)}" alt="" />`
                  : `<span class="product-placeholder">🛍️</span>`
              }
            </div>
            <div class="product-main">
              <h4>${escapeHtml(p.name)} ${p.is_available === false ? '<span class="chip chip-muted">Hidden</span>' : ""}</h4>
              <p>${escapeHtml(p.description || "-")}</p>
              <small>${formatInr(p.price)} ${escapeHtml(p.price_unit || "")} · ${escapeHtml(p.category || "Uncategorized")}</small>
              <details class="edit-details">
                <summary>Edit product</summary>
                <form class="form-grid edit-product-form" data-edit-product="${escapeHtml(p.id)}">
                  <input name="name" type="text" value="${escapeHtml(p.name)}" required />
                  <textarea name="description" rows="2">${escapeHtml(p.description)}</textarea>
                  <input name="price" type="number" min="0" step="0.01" value="${escapeHtml(p.price ?? "")}" />
                  <input name="price_unit" type="text" value="${escapeHtml(p.price_unit)}" />
                  <input name="category" type="text" value="${escapeHtml(p.category)}" />
                  <input name="stock_count" type="number" min="0" value="${escapeHtml(p.stock_count ?? "")}" placeholder="Stock count" />
                  <label class="toggle-row">
                    <span>Visible on public page</span>
                    <input type="checkbox" name="is_available" ${p.is_available !== false ? "checked" : ""} />
                  </label>
                  <button class="btn btn-outline">Save changes</button>
                </form>
                <form data-gallery-upload="${escapeHtml(p.id)}" style="margin-top:8px">
                  <label class="hint">Add gallery image</label>
                  <input type="file" name="image" accept="image/*" required />
                  <button class="btn btn-outline btn-sm">Upload</button>
                </form>
              </details>
            </div>
            <div class="actions">
              <button type="button" data-move-up="${escapeHtml(p.id)}" class="btn btn-outline btn-sm" ${index === 0 ? "disabled" : ""}>↑</button>
              <button type="button" data-move-down="${escapeHtml(p.id)}" class="btn btn-outline btn-sm" ${index === sorted.length - 1 ? "disabled" : ""}>↓</button>
              <button data-delete-product="${escapeHtml(p.id)}" class="btn btn-outline">Delete</button>
              <form data-upload-product-image="${escapeHtml(p.id)}">
                <input type="file" name="image" accept="image/*" required />
                <button class="btn btn-outline">Upload image</button>
              </form>
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}
