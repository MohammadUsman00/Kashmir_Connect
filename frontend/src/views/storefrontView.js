import { escapeHtml } from "../lib/escape.js";
import { getStorefrontPath } from "../lib/publicPaths.js";

export function renderStorefrontView(data) {
  const storefront = data?.storefront || null;
  if (!storefront) {
    return `
      <section class="panel">
        <span class="section-label">Storefront</span>
        <h2>Create your storefront</h2>
        <div class="form-grid" style="margin-bottom:12px">
          <label class="hint">Quick start with a sector template</label>
          <select id="sector-template-select">
            <option value="">Choose template (optional)</option>
            <option value="handicrafts">Handicrafts</option>
            <option value="tourism">Tourism</option>
            <option value="agriculture">Agriculture</option>
            <option value="food">Food</option>
          </select>
          <button type="button" id="apply-sector-template" class="btn btn-outline">Apply template</button>
        </div>
        <form id="create-storefront-form" class="form-grid">
          <input required name="business_name" type="text" placeholder="Business name" />
          <input name="tagline" type="text" placeholder="Tagline" />
          <textarea name="description" rows="3" placeholder="Description"></textarea>
          <select required name="sector">
            <option value="">Select sector</option>
            <option value="handicrafts">Handicrafts</option>
            <option value="agriculture">Agriculture</option>
            <option value="tourism">Tourism</option>
            <option value="food">Food</option>
            <option value="other">Other</option>
          </select>
          <input name="district" type="text" placeholder="District" />
          <input name="phone" type="text" placeholder="Phone" />
          <input name="whatsapp" type="text" placeholder="WhatsApp" />
          <input name="email" type="email" placeholder="Business email" />
          <input name="instagram" type="text" placeholder="Instagram handle" />
          <button class="btn">Create storefront</button>
        </form>
      </section>
    `;
  }

  const publicPath = storefront.slug ? getStorefrontPath(storefront.slug) : "";
  const publicFull = publicPath ? `${window.location.origin}${publicPath}` : storefront.public_url || "";
  const isActive = storefront.is_active !== false;
  const verified = storefront.is_verified;

  return `
    <section class="panel">
      <span class="section-label">Storefront</span>
      <h2>Your storefront</h2>
      <div class="status-row">
        <span class="chip ${isActive ? "chip-success" : "chip-muted"}">${isActive ? "Published" : "Unpublished"}</span>
        ${verified ? '<span class="chip chip-gold">Verified</span>' : '<span class="chip chip-muted">Not verified yet</span>'}
        <span class="chip">${escapeHtml(storefront.view_count ?? 0)} views</span>
      </div>
      <div class="storefront-links row">
        <p>Public page:
          <a id="preview-storefront" target="_blank" rel="noopener" href="${escapeHtml(publicPath || "#")}">${escapeHtml(publicFull)}</a>
        </p>
        <button type="button" id="copy-storefront-link" class="btn btn-outline" data-url="${escapeHtml(publicFull)}">Copy link</button>
        <button type="button" id="share-whatsapp-storefront" class="btn btn-outline" data-url="${escapeHtml(publicFull)}" data-name="${escapeHtml(storefront.business_name)}">Share on WhatsApp</button>
        <button type="button" id="generate-storefront-qr" class="btn btn-outline" data-id="${escapeHtml(storefront.id)}">Generate QR</button>
        <button type="button" id="toggle-publish-storefront" class="btn ${isActive ? "btn-outline" : ""}" data-id="${escapeHtml(storefront.id)}" data-active="${isActive}">
          ${isActive ? "Unpublish" : "Publish"}
        </button>
      </div>
      <div id="storefront-qr-preview" class="qr-preview"></div>
      <h3>Share kit</h3>
      <p class="hint">One-tap WhatsApp messages for your business (free).</p>
      <div class="share-kit" id="share-kit-chips"></div>
      <form id="update-storefront-form" class="form-grid" data-id="${escapeHtml(storefront.id)}">
        <input name="business_name" type="text" placeholder="Business name" value="${escapeHtml(storefront.business_name)}" />
        <input name="tagline" type="text" placeholder="Tagline" value="${escapeHtml(storefront.tagline)}" />
        <textarea name="description" rows="3" placeholder="Description">${escapeHtml(storefront.description)}</textarea>
        <select name="sector">
          <option value="">Select sector</option>
          ${["handicrafts", "agriculture", "tourism", "food", "other"]
            .map((s) => `<option value="${s}" ${storefront.sector === s ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
        <input name="district" type="text" placeholder="District" value="${escapeHtml(storefront.district)}" />
        <input name="phone" type="text" placeholder="Phone" value="${escapeHtml(storefront.phone)}" />
        <input name="whatsapp" type="text" placeholder="WhatsApp" value="${escapeHtml(storefront.whatsapp)}" />
        <input name="email" type="email" placeholder="Business email" value="${escapeHtml(storefront.email)}" />
        <input name="instagram" type="text" placeholder="Instagram handle" value="${escapeHtml(storefront.instagram)}" />
        <button class="btn">Update storefront</button>
      </form>
      <div class="row">
        <form id="upload-cover-form" data-id="${escapeHtml(storefront.id)}">
          <label>Upload cover image</label>
          <input name="cover" type="file" accept="image/*" required />
          <button class="btn btn-outline">Upload cover</button>
        </form>
        <form id="upload-logo-form" data-id="${escapeHtml(storefront.id)}">
          <label>Upload logo image</label>
          <input name="logo" type="file" accept="image/*" required />
          <button class="btn btn-outline">Upload logo</button>
        </form>
      </div>
    </section>
  `;
}
