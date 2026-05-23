import { escapeHtml } from "../lib/escape.js";

export function renderLeadsView(leads = []) {
  if (!leads.length) {
    return `
      <section class="panel">
        <span class="section-label">Customers</span>
        <h2>Leads & inquiries</h2>
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <p>No inquiries yet. Share your storefront link on WhatsApp to get leads.</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="panel">
      <span class="section-label">Customers</span>
      <h2>Leads & inquiries</h2>
      <div class="list">
        ${leads
          .map(
            (l) => `
          <article class="list-item">
            <div>
              <h4>${escapeHtml(l.customer_name || "Anonymous")}</h4>
              <p class="hint">${escapeHtml(l.customer_phone || "—")} · ${escapeHtml(l.products?.name || "General")}</p>
              <p>${escapeHtml(l.message || "")}</p>
              <small class="hint">${new Date(l.created_at).toLocaleString()} · ${escapeHtml(l.source)}</small>
            </div>
            <select data-lead-status="${escapeHtml(l.id)}" class="lead-status-select">
              <option value="new" ${l.status === "new" ? "selected" : ""}>New</option>
              <option value="contacted" ${l.status === "contacted" ? "selected" : ""}>Contacted</option>
              <option value="closed" ${l.status === "closed" ? "selected" : ""}>Closed</option>
            </select>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}
