import { escapeHtml } from "../lib/escape.js";

export function renderReviewsManageView(reviews = []) {
  if (!reviews.length) {
    return `
      <section class="panel">
        <span class="section-label">Trust</span>
        <h2>Customer reviews</h2>
        <div class="empty-state"><p>No reviews submitted yet.</p></div>
      </section>
    `;
  }

  return `
    <section class="panel">
      <span class="section-label">Trust</span>
      <h2>Customer reviews</h2>
      <div class="list">
        ${reviews
          .map(
            (r) => `
          <article class="list-item">
            <div>
              <h4>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} · ${escapeHtml(r.author_name)}</h4>
              <p>${escapeHtml(r.body || "")}</p>
              <small class="hint">${new Date(r.created_at).toLocaleString()} · ${r.is_approved ? "Published" : "Pending approval"}</small>
            </div>
            <div class="actions">
              ${
                !r.is_approved
                  ? `<button type="button" class="btn btn-sm" data-approve-review="${escapeHtml(r.id)}">Approve</button>`
                  : `<button type="button" class="btn btn-outline btn-sm" data-hide-review="${escapeHtml(r.id)}">Hide</button>`
              }
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}
