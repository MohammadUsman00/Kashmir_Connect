import "./styles/public.css";
import { escapeHtml } from "./lib/escape.js";
import { formatInr, uniqueCategories } from "./lib/format.js";
import { setPageMeta } from "./lib/meta.js";
import { parseStorefrontSlug } from "./lib/publicPaths.js";
import { buildStorefrontShareText, copyToClipboard } from "./lib/share.js";
import { recordEvent } from "./services/analyticsService.js";
import { createOrder } from "./services/ordersService.js";
import { createReview } from "./services/reviewsService.js";
import { getPublicStorefront } from "./services/storefrontService.js";
import { bindKcNav, renderKcFooter, renderKcNav } from "./ui/kcNav.js";

const root = document.getElementById("app");
let storefrontData = null;
let activeCategory = "all";

function waLink(number, message) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(message || "Hello, I found your business on KashmirConnect.");
  return `https://wa.me/${digits}?text=${text}`;
}

function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function filteredProducts(products) {
  if (activeCategory === "all") return products;
  return products.filter((p) => (p.category || "Uncategorized") === activeCategory);
}

function renderProductCard(p, storefront) {
  const galleryImg = p.gallery?.[0]?.image_url || p.image_url;
  const img = galleryImg ? `<img src="${escapeHtml(galleryImg)}" alt="" />` : "🛍️";
  const price = p.price != null ? formatInr(p.price) + " " + escapeHtml(p.price_unit || "") : "";
  const lowStock =
    p.stock_count != null && p.stock_count <= 3
      ? `<span class="product-tag" style="background:#fee2e2">Low stock: ${p.stock_count}</span>`
      : "";
  const inquiryMsg = `Hi, I'm interested in "${p.name}" from your KashmirConnect storefront.`;
  const inquiryWa = waLink(storefront.whatsapp || storefront.phone, inquiryMsg);

  return `
    <article class="product-card" data-product-id="${escapeHtml(p.id)}">
      <div class="product-img">${img}</div>
      <div class="product-info">
        <h4>${escapeHtml(p.name)}</h4>
        ${p.category ? `<span class="product-tag">${escapeHtml(p.category)}</span>` : ""}
        ${lowStock}
        <p class="pub-muted">${escapeHtml(p.description || "")}</p>
        <div class="product-price">${price}</div>
        ${
          inquiryWa
            ? `<a class="pub-btn pub-btn-outline product-inquire" href="${escapeHtml(inquiryWa)}" target="_blank" rel="noopener" data-product-id="${escapeHtml(p.id)}">Inquire on WhatsApp</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderReviews(reviews = []) {
  if (!reviews.length) return "";
  return `
    <div class="reviews-public">
      <h3>Customer reviews</h3>
      ${reviews
        .map(
          (r) => `
        <div class="review-card">
          <strong>${"★".repeat(r.rating)}</strong> · ${escapeHtml(r.author_name)}
          <p class="pub-muted">${escapeHtml(r.body || "")}</p>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function renderStorefront() {
  const { storefront, products, badge, reviews } = storefrontData;
  const coverStyle = storefront.cover_image_url
    ? `style="background-image:url('${escapeHtml(storefront.cover_image_url)}')"`
    : "";
  const logoInner = storefront.logo_url
    ? `<img src="${escapeHtml(storefront.logo_url)}" alt="" />`
    : escapeHtml((storefront.business_name || "?").charAt(0));
  const badgeHtml = badge
    ? `<a class="sf-badge" href="/verify/${escapeHtml(badge.badge_code)}">✓ Verified · ${escapeHtml(badge.badge_code)}</a>`
    : "";
  const wa = waLink(storefront.whatsapp || storefront.phone);
  const publicUrl = window.location.href;
  const categories = uniqueCategories(products);
  const visible = filteredProducts(products);

  const categoryFilters =
    categories.length > 0
      ? `
    <div class="filters product-filters">
      <button type="button" class="filter-chip ${activeCategory === "all" ? "active" : ""}" data-category="all">All</button>
      ${categories
        .map(
          (c) =>
            `<button type="button" class="filter-chip ${activeCategory === c ? "active" : ""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`
        )
        .join("")}
    </div>
  `
      : "";

  root.innerHTML = `
    ${renderKcNav({ links: [{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }], showDashboard: true })}
    <div class="kc-page">
      <div class="share-bar no-print">
        <button type="button" id="copy-page-link" class="pub-btn pub-btn-outline">Copy link</button>
        <button type="button" id="share-page-wa" class="pub-btn pub-btn-outline">Share</button>
        <button type="button" onclick="window.print()" class="pub-btn pub-btn-outline">Print</button>
      </div>
      <div class="pub-card">
        <div class="sf-cover" ${coverStyle}></div>
        <div class="sf-header">
          <div class="sf-logo">${logoInner}</div>
          <div>
            ${badgeHtml}
            <h1>${escapeHtml(storefront.business_name)}</h1>
            <p class="pub-muted">${escapeHtml(storefront.tagline || "")}</p>
          </div>
        </div>
        <div class="sf-body">
          <p>${escapeHtml(storefront.description || "")}</p>
          <div class="contact-strip">
            <span>${escapeHtml(storefront.sector || "")}${storefront.district ? ` · ${escapeHtml(storefront.district)}` : ""}</span>
            ${storefront.phone ? `<a href="tel:${escapeHtml(storefront.phone)}">${escapeHtml(storefront.phone)}</a>` : ""}
            ${
              storefront.instagram
                ? `<a href="https://instagram.com/${escapeHtml(String(storefront.instagram).replace("@", ""))}" target="_blank" rel="noopener">Instagram</a>`
                : ""
            }
            ${storefront.email ? `<a href="mailto:${escapeHtml(storefront.email)}">Email</a>` : ""}
          </div>
          ${wa ? `<a id="wa-btn" class="pub-btn pub-btn-wa" href="${escapeHtml(wa)}" target="_blank" rel="noopener">WhatsApp this business</a>` : ""}
          <h3>Products</h3>
          ${categoryFilters}
          <div class="product-grid" id="product-grid">
            ${visible.map((p) => renderProductCard(p, storefront)).join("") || "<p class='pub-muted empty-state'>No products in this category.</p>"}
          </div>
          ${renderReviews(reviews)}
          <div class="pub-form-box">
            <h4>Request an order</h4>
            <form id="order-form" class="form-grid">
              <input type="hidden" name="storefront_id" value="${escapeHtml(storefront.id)}" />
              <input required name="customer_name" placeholder="Your name" />
              <input required name="customer_phone" placeholder="Phone / WhatsApp" />
              <input name="quantity" type="number" min="1" value="1" placeholder="Quantity" />
              <textarea name="notes" rows="2" placeholder="Order notes (optional)"></textarea>
              <button type="submit" class="pub-btn">Submit order request</button>
            </form>
          </div>
          <div class="pub-form-box">
            <h4>Leave a review</h4>
            <form id="review-form" class="form-grid">
              <input type="hidden" name="storefront_id" value="${escapeHtml(storefront.id)}" />
              <input required name="author_name" placeholder="Your name" />
              <select required name="rating">
                <option value="5">★★★★★</option>
                <option value="4">★★★★☆</option>
                <option value="3">★★★☆☆</option>
                <option value="2">★★☆☆☆</option>
                <option value="1">★☆☆☆☆</option>
              </select>
              <textarea name="body" rows="2" placeholder="Your experience…"></textarea>
              <button type="submit" class="pub-btn btn-outline">Submit review</button>
            </form>
          </div>
        </div>
      </div>
      ${renderKcFooter()}
    </div>
  `;

  bindKcNav();

  setPageMeta({
    title: `${storefront.business_name} · KashmirConnect`,
    description: storefront.tagline || storefront.description?.slice(0, 160) || "Kashmir business on KashmirConnect",
    image: storefront.cover_image_url || storefront.logo_url,
    url: publicUrl,
  });

  document.getElementById("copy-page-link")?.addEventListener("click", async () => {
    await copyToClipboard(publicUrl);
    document.getElementById("copy-page-link").textContent = "Copied!";
    setTimeout(() => {
      document.getElementById("copy-page-link").textContent = "Copy link";
    }, 2000);
  });

  document.getElementById("share-page-wa")?.addEventListener("click", () => {
    const text = buildStorefrontShareText(storefront.business_name, publicUrl);
    window.open(whatsappShareUrl(text), "_blank", "noopener");
  });

  document.getElementById("wa-btn")?.addEventListener("click", () => {
    recordEvent({ storefront_id: storefront.id, event_type: "whatsapp_click" }).catch(() => {});
  });

  root.querySelectorAll(".product-inquire, [data-product-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const productId = el.dataset.productId;
      if (!productId) return;
      recordEvent({ storefront_id: storefront.id, product_id: productId, event_type: "product_view" }).catch(() => {});
    });
  });

  root.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;
      renderStorefront();
    });
  });

  document.getElementById("order-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.quantity = Number(payload.quantity || 1);
    try {
      await createOrder(payload);
      showFormMessage(e.target, "Order request sent! The business will contact you.");
      e.target.reset();
    } catch {
      showFormMessage(e.target, "Could not submit. Try WhatsApp instead.", true);
    }
  });

  document.getElementById("review-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    payload.rating = Number(payload.rating);
    try {
      const res = await createReview(payload);
      showFormMessage(e.target, res.message || "Thank you! Review submitted for approval.");
      e.target.reset();
    } catch {
      showFormMessage(e.target, "Could not submit review.", true);
    }
  });
}

function showFormMessage(form, text, isError = false) {
  let el = form.querySelector(".form-msg");
  if (!el) {
    el = document.createElement("p");
    el.className = "form-msg hint";
    form.appendChild(el);
  }
  el.textContent = text;
  el.style.color = isError ? "#b91c1c" : "";
}

async function init() {
  const slug = parseStorefrontSlug();
  if (!slug) {
    root.innerHTML = `${renderKcNav({ links: [{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }] })}<div class="kc-page error-box">Storefront not found.</div>`;
    bindKcNav();
    return;
  }

  try {
    storefrontData = await getPublicStorefront(slug);
    renderStorefront();
  } catch {
    root.innerHTML = `${renderKcNav({ links: [{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }] })}<div class="kc-page error-box">Storefront not found or unavailable.</div>`;
    bindKcNav();
  }
}

init();
