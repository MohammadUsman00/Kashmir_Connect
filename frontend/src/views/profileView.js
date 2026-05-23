import { escapeHtml } from "../lib/escape.js";

function profileCompletion(profile = {}) {
  const fields = ["full_name", "phone", "business_name", "district", "sector", "bio"];
  const filled = fields.filter((f) => profile[f]).length;
  return Math.round((filled / fields.length) * 100);
}

export function renderProfileView(profile = {}) {
  const pct = profileCompletion(profile);

  return `
    <section class="panel">
      <span class="section-label">Your account</span>
      <h2>Profile</h2>
      <p class="hint">Profile strength: <strong>${pct}%</strong> — complete your profile to build trust.</p>
      <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <form id="profile-form" class="form-grid">
        <input name="full_name" type="text" placeholder="Full name" value="${escapeHtml(profile.full_name)}" />
        <input name="phone" type="text" placeholder="Phone" value="${escapeHtml(profile.phone)}" />
        <input name="business_name" type="text" placeholder="Business name" value="${escapeHtml(profile.business_name)}" />
        <input name="district" type="text" placeholder="District" value="${escapeHtml(profile.district)}" />
        <select name="sector">
          <option value="">Select sector</option>
          ${["handicrafts", "agriculture", "tourism", "food", "other"]
            .map((s) => `<option value="${s}" ${profile.sector === s ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
        <textarea name="bio" rows="3" placeholder="Tell customers about your business…">${escapeHtml(profile.bio)}</textarea>
        <button class="btn">Save profile</button>
      </form>
    </section>
  `;
}
