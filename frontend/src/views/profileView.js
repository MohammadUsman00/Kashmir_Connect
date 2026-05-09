export function renderProfileView(profile = {}) {
  return `
    <section class="panel">
      <h2>Profile</h2>
      <form id="profile-form" class="form-grid">
        <input name="full_name" type="text" placeholder="Full name" value="${profile.full_name || ""}" />
        <input name="phone" type="text" placeholder="Phone" value="${profile.phone || ""}" />
        <input name="business_name" type="text" placeholder="Business name" value="${profile.business_name || ""}" />
        <input name="district" type="text" placeholder="District" value="${profile.district || ""}" />
        <select name="sector">
          <option value="">Select sector</option>
          ${["handicrafts", "agriculture", "tourism", "food", "other"]
            .map((s) => `<option value="${s}" ${profile.sector === s ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
        <textarea name="bio" rows="3" placeholder="Bio">${profile.bio || ""}</textarea>
        <button class="btn">Save profile</button>
      </form>
    </section>
  `;
}
