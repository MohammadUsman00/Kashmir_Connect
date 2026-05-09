export function renderBadgesView(storefront, badge) {
  if (!storefront?.id) {
    return `<section class="panel"><h2>Badges</h2><p>Create a storefront first.</p></section>`;
  }

  return `
    <section class="panel">
      <h2>Authenticity Badge</h2>
      ${
        badge
          ? `
        <div class="badge-card">
          <p><strong>Code:</strong> ${badge.badge_code}</p>
          <p><strong>Status:</strong> ${badge.status}</p>
          <p><strong>QR:</strong> ${badge.qr_code_url ? `<a href="${badge.qr_code_url}" target="_blank">Open QR</a>` : "Not generated"}</p>
          <button id="generate-qr-btn" class="btn btn-outline" data-badge-code="${badge.badge_code}">Generate QR</button>
        </div>
      `
          : `
        <form id="badge-request-form" class="form-grid" data-storefront-id="${storefront.id}">
          <input required name="business_type" type="text" placeholder="Business type" />
          <input required name="years_in_business" type="number" min="0" placeholder="Years in business" />
          <input required name="address" type="text" placeholder="Address" />
          <textarea name="description" rows="2" placeholder="Description"></textarea>
          <button class="btn">Request badge</button>
        </form>
      `
      }
    </section>
  `;
}
