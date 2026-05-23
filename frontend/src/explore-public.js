import "./styles/public.css";
import { escapeHtml } from "./lib/escape.js";
import { setPageMeta } from "./lib/meta.js";
import { getStorefrontPath } from "./lib/publicPaths.js";
import { getExploreStorefronts } from "./services/storefrontService.js";
import { bindKcNav, renderKcFooter, renderKcNav } from "./ui/kcNav.js";

const root = document.getElementById("app");
const state = { page: 1, limit: 12, total: 0 };

function renderList(items) {
  if (!items.length) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🏔️</div>
        <p>No verified storefronts match your filters yet.</p>
        <p><a href="/app.html" class="pub-btn" style="margin-top:1rem">Create yours free</a></p>
      </div>
    `;
  }

  return `
    <div class="explore-grid">
      ${items
        .map((s) => {
          const cover = s.cover_image_url
            ? `style="background-image:url('${escapeHtml(s.cover_image_url)}')"`
            : "";
          return `
        <a class="explore-card" href="${escapeHtml(getStorefrontPath(s.slug))}">
          <div class="explore-cover" ${cover}></div>
          <h3>${escapeHtml(s.business_name)}</h3>
          <p class="pub-muted">${escapeHtml(s.tagline || s.sector || "")}</p>
          <p class="pub-muted">${escapeHtml(s.district || "")}</p>
        </a>
      `;
        })
        .join("")}
    </div>
  `;
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
  if (totalPages <= 1) return "";

  return `
    <div class="pagination">
      <button type="button" id="page-prev" class="pub-btn pub-btn-outline" ${state.page <= 1 ? "disabled" : ""}>Previous</button>
      <span class="pub-muted">Page ${state.page} of ${totalPages}</span>
      <button type="button" id="page-next" class="pub-btn pub-btn-outline" ${state.page >= totalPages ? "disabled" : ""}>Next</button>
    </div>
  `;
}

function renderFilters({ sector, district, search }) {
  return `
    <div class="filters">
      <input id="filter-search" type="search" placeholder="Search businesses…" value="${escapeHtml(search)}" />
      <select id="filter-sector">
        <option value="">All sectors</option>
        ${["handicrafts", "agriculture", "tourism", "food", "other"]
          .map((s) => `<option value="${s}" ${sector === s ? "selected" : ""}>${s}</option>`)
          .join("")}
      </select>
      <input id="filter-district" type="text" placeholder="District" value="${escapeHtml(district)}" />
      <button id="filter-apply" class="pub-btn">Search</button>
    </div>
  `;
}

async function load(page = 1) {
  const params = new URLSearchParams(window.location.search);
  const sector = params.get("sector") || "";
  const district = params.get("district") || "";
  const search = params.get("search") || "";
  state.page = page;

  root.innerHTML = `
    ${renderKcNav({
      links: [
        { href: "/", label: "Home" },
        { href: "/explore", label: "Explore", active: true },
      ],
      showDashboard: true,
    })}
    <div class="kc-page">
      <div class="kc-page-hero">
        <span class="section-label">Marketplace</span>
        <h1>Explore Kashmir businesses</h1>
        <p class="pub-muted">Verified storefronts — handicrafts, farms, tourism &amp; more.</p>
      </div>
      ${renderFilters({ sector, district, search })}
      <div id="explore-results" class="loading">Loading…</div>
      <div id="explore-pagination"></div>
      ${renderKcFooter()}
    </div>
  `;

  bindKcNav();

  setPageMeta({
    title: "Explore · KashmirConnect",
    description: "Discover verified Kashmir businesses — handicrafts, agriculture, tourism, and more.",
    url: window.location.href,
  });

  const apply = (nextPage = 1) => {
    const next = new URLSearchParams();
    const s = document.getElementById("filter-search").value.trim();
    const sec = document.getElementById("filter-sector").value;
    const dist = document.getElementById("filter-district").value.trim();
    if (s) next.set("search", s);
    if (sec) next.set("sector", sec);
    if (dist) next.set("district", dist);
    if (nextPage > 1) next.set("page", String(nextPage));
    window.location.search = next.toString() ? `?${next.toString()}` : "";
  };

  document.getElementById("filter-apply").addEventListener("click", () => apply(1));
  document.getElementById("filter-search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") apply(1);
  });

  try {
    const qs = new URLSearchParams({ sector, district, search, page: String(state.page), limit: String(state.limit) });
    const data = await getExploreStorefronts(qs.toString());
    const items = data.items || [];
    state.total = data.total || items.length;

    document.getElementById("explore-results").innerHTML = renderList(items);
    document.getElementById("explore-pagination").innerHTML = renderPagination();

    document.getElementById("page-prev")?.addEventListener("click", () => {
      if (state.page > 1) apply(state.page - 1);
    });
    document.getElementById("page-next")?.addEventListener("click", () => {
      const totalPages = Math.ceil(state.total / state.limit);
      if (state.page < totalPages) apply(state.page + 1);
    });
  } catch {
    document.getElementById("explore-results").innerHTML = `
      <div class="empty-state">
        <p>Could not load storefronts. Start the backend API to see live listings.</p>
        <p><a href="/app.html" class="pub-btn" style="margin-top:1rem">Open Dashboard</a></p>
      </div>
    `;
  }
}

const initialPage = Number(new URLSearchParams(window.location.search).get("page") || 1);
load(initialPage);
