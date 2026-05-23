import { escapeHtml } from "../lib/escape.js";
import { getStorefrontPath } from "../lib/publicPaths.js";

export function renderAdminView(pendingBadges = []) {
  if (!pendingBadges.length) {
    return `
      <section class="panel">
        <h2>Admin — Badge verification</h2>
        <p class="hint">No pending badge requests right now.</p>
      </section>
    `;
  }

  return `
    <section class="panel">
      <h2>Admin — Pending badge requests</h2>
      <p class="hint">Review applications and approve verified Kashmir businesses.</p>
      <div class="list">
        ${pendingBadges
          .map(
            (b) => `
          <article class="list-item admin-badge-item">
            <div>
              <h4>${escapeHtml(b.business_name)} · ${escapeHtml(b.badge_code)}</h4>
              <p>${escapeHtml(b.sector || "")} · ${escapeHtml(b.district || "")}</p>
              <small>Type: ${escapeHtml(b.verification_notes?.business_type || "—")} · Years: ${escapeHtml(b.verification_notes?.years_in_business ?? "—")}</small>
              <small>Address: ${escapeHtml(b.verification_notes?.address || "—")}</small>
              ${
                b.slug
                  ? `<p><a target="_blank" rel="noopener" href="${escapeHtml(getStorefrontPath(b.slug))}">Preview storefront</a></p>`
                  : ""
              }
            </div>
            <button type="button" class="btn" data-approve-badge="${escapeHtml(b.id)}">Approve</button>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}
