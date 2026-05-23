import { escapeHtml } from "../lib/escape.js";

export function renderOrdersView(orders = []) {
  if (!orders.length) {
    return `
      <section class="panel">
        <span class="section-label">Sales</span>
        <h2>Order requests</h2>
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <p>No order requests yet. Customers can request orders from your public storefront.</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="panel">
      <span class="section-label">Sales</span>
      <h2>Order requests</h2>
      <div class="list">
        ${orders
          .map(
            (o) => `
          <article class="list-item">
            <div>
              <h4>${escapeHtml(o.customer_name)}</h4>
              <p class="hint">${escapeHtml(o.customer_phone)} · Qty: ${o.quantity}</p>
              <p>${escapeHtml(o.products?.name || "General order")}</p>
              <p>${escapeHtml(o.notes || "")}</p>
              <small class="hint">${new Date(o.created_at).toLocaleString()}</small>
            </div>
            <select data-order-status="${escapeHtml(o.id)}" class="order-status-select">
              <option value="pending" ${o.status === "pending" ? "selected" : ""}>Pending</option>
              <option value="confirmed" ${o.status === "confirmed" ? "selected" : ""}>Confirmed</option>
              <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Delivered</option>
              <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}
