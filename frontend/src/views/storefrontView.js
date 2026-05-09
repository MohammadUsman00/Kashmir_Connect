export function renderStorefrontView(data) {
  const storefront = data?.storefront || null;
  if (!storefront) {
    return `
      <section class="panel">
        <h2>Create Storefront</h2>
        <form id="create-storefront-form" class="form-grid">
          <input required name="business_name" type="text" placeholder="Business name" />
          <input name="tagline" type="text" placeholder="Tagline" />
          <textarea name="description" rows="3" placeholder="Description"></textarea>
          <input required name="sector" type="text" placeholder="Sector" />
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

  return `
    <section class="panel">
      <h2>Storefront</h2>
      <p>Public URL: <a target="_blank" href="https://${storefront.public_url}">${storefront.public_url}</a></p>
      <form id="update-storefront-form" class="form-grid" data-id="${storefront.id}">
        <input name="business_name" type="text" placeholder="Business name" value="${storefront.business_name || ""}" />
        <input name="tagline" type="text" placeholder="Tagline" value="${storefront.tagline || ""}" />
        <textarea name="description" rows="3" placeholder="Description">${storefront.description || ""}</textarea>
        <input name="sector" type="text" placeholder="Sector" value="${storefront.sector || ""}" />
        <input name="district" type="text" placeholder="District" value="${storefront.district || ""}" />
        <input name="phone" type="text" placeholder="Phone" value="${storefront.phone || ""}" />
        <input name="whatsapp" type="text" placeholder="WhatsApp" value="${storefront.whatsapp || ""}" />
        <input name="email" type="email" placeholder="Business email" value="${storefront.email || ""}" />
        <input name="instagram" type="text" placeholder="Instagram handle" value="${storefront.instagram || ""}" />
        <button class="btn">Update storefront</button>
      </form>
      <div class="row">
        <form id="upload-cover-form" data-id="${storefront.id}">
          <label>Upload cover image</label>
          <input name="cover" type="file" accept="image/*" required />
          <button class="btn btn-outline">Upload cover</button>
        </form>
        <form id="upload-logo-form" data-id="${storefront.id}">
          <label>Upload logo image</label>
          <input name="logo" type="file" accept="image/*" required />
          <button class="btn btn-outline">Upload logo</button>
        </form>
      </div>
    </section>
  `;
}
