export function renderProductsView(storefront, products = []) {
  if (!storefront?.id) {
    return `<section class="panel"><h2>Products</h2><p>Create a storefront first.</p></section>`;
  }

  return `
    <section class="panel">
      <h2>Products</h2>
      <form id="create-product-form" class="form-grid" data-storefront-id="${storefront.id}">
        <input required name="name" type="text" placeholder="Product name" />
        <textarea name="description" rows="2" placeholder="Description"></textarea>
        <input name="price" type="number" min="0" step="0.01" placeholder="Price" />
        <input name="price_unit" type="text" placeholder="Price unit (piece, kg, etc)" />
        <input name="category" type="text" placeholder="Category" />
        <button class="btn">Add product</button>
      </form>
      <div class="list">
        ${products
          .map(
            (p) => `
          <article class="list-item">
            <div>
              <h4>${p.name}</h4>
              <p>${p.description || "-"}</p>
              <small>Price: ${p.price || "-"} ${p.price_unit || ""}</small>
            </div>
            <div class="actions">
              <button data-delete-product="${p.id}" class="btn btn-outline">Delete</button>
              <form data-upload-product-image="${p.id}">
                <input type="file" name="image" accept="image/*" required />
                <button class="btn btn-outline">Upload image</button>
              </form>
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}
