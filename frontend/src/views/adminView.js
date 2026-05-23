import { escapeHtml } from "../lib/escape.js";
import { getStorefrontPath } from "../lib/publicPaths.js";

export function renderAdminView({ pendingBadges = [], storefronts = [], stats = null } = {}) {
  const statsHtml = stats
    ? `<div class="kpis" style="margin-bottom:1rem">
        <div class="kpi"><span>Storefronts</span><strong>${stats.storefronts}</strong></div>
        <div class="kpi"><span>Products</span><strong>${stats.products}</strong></div>
        <div class="kpi"><span>Leads</span><strong>${stats.leads}</strong></div>
        <div class="kpi"><span>Orders</span><strong>${stats.orders}</strong></div>
      </div>`
    : "";

  const badgesHtml = pendingBadges.length
    ? pendingBadges
        .map(
          (b) => `
        <article class="list-item admin-badge-item">
          <div>
            <h4>${escapeHtml(b.business_name)} · ${escapeHtml(b.badge_code)}</h4>
            <p class="hint">${escapeHtml(b.sector || "")} · ${escapeHtml(b.district || "")}</p>
            ${b.slug ? `<p><a target="_blank" href="${escapeHtml(getStorefrontPath(b.slug))}">Preview</a></p>` : ""}
          </div>
          <div class="actions">
            <button type="button" class="btn btn-sm" data-approve-badge="${escapeHtml(b.id)}">Approve</button>
            <button type="button" class="btn btn-outline btn-sm" data-reject-badge="${escapeHtml(b.id)}">Reject</button>
          </div>
        </article>
      `
        )
        .join("")
    : `<p class="hint">No pending badge requests.</p>`;

  const storefrontsHtml = storefronts.length
    ? storefronts
        .map(
          (s) => `
        <article class="list-item">
          <div>
            <h4>${escapeHtml(s.business_name)} ${s.is_featured ? '<span class="chip chip-gold">Featured</span>' : ""}</h4>
            <p class="hint">${escapeHtml(s.sector)} · ${escapeHtml(s.district || "")} · ${s.view_count || 0} views</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" data-toggle-featured="${escapeHtml(s.id)}" data-featured="${s.is_featured}">
            ${s.is_featured ? "Unfeature" : "Feature"}
          </button>
        </article>
      `
        )
        .join("")
    : `<p class="hint">No storefronts yet.</p>`;

  return `
    <section class="panel">
      <span class="section-label">Admin</span>
      <h2>Platform management</h2>
      ${statsHtml}
      <h3>Pending badges</h3>
      <div class="list">${badgesHtml}</div>
      <h3 style="margin-top:1.5rem">Storefronts</h3>
      <div class="list">${storefrontsHtml}</div>
    </section>
  `;
}
