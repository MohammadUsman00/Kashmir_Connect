export const KC_LOGO_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L3 7l9 5 9-5-9-5z" fill="#C8922A"/>
  <path d="M3 12l9 5 9-5" stroke="#F0C060" stroke-width="2" stroke-linecap="round"/>
  <path d="M3 17l9 5 9-5" stroke="rgba(240,192,96,0.5)" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/**
 * @param {{ links?: { href: string, label: string, active?: boolean, cta?: boolean }[], showDashboard?: boolean, dashboardHref?: string }} opts
 */
export function renderKcNav(opts = {}) {
  const {
    links = [
      { href: "/", label: "Home" },
      { href: "/explore", label: "Explore" },
    ],
    showDashboard = true,
    dashboardHref = "/app.html",
  } = opts;

  const linkHtml = links
    .map((l) => {
      const cls = l.cta ? "kc-nav-cta" : l.active ? "active" : "";
      return `<a href="${l.href}" class="${cls}">${l.label}</a>`;
    })
    .join("");

  const dashHtml = showDashboard
    ? `<a href="${dashboardHref}" class="kc-nav-cta">Dashboard</a>`
    : "";

  const mobileLinks = links
    .filter((l) => !l.cta)
    .map((l) => `<a href="${l.href}">${l.label}</a>`)
    .join("");

  return `
    <nav class="kc-nav">
      <a class="kc-nav-logo" href="/">
        <span class="kc-nav-icon">${KC_LOGO_SVG}</span>
        <span class="kc-nav-brand">KashmirConnect</span>
      </a>
      <div class="kc-nav-links">
        ${linkHtml}
        ${dashHtml}
      </div>
      <button type="button" class="kc-nav-hamburger" aria-label="Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </nav>
    <div id="kc-mobile-menu" class="kc-mobile-menu" aria-hidden="true">
      ${mobileLinks}
      ${showDashboard ? `<a href="${dashboardHref}">Dashboard</a>` : ""}
    </div>
  `;
}

export function bindKcNav() {
  const menuBtn = document.querySelector(".kc-nav-hamburger");
  const mobileMenu = document.getElementById("kc-mobile-menu");
  if (!menuBtn || !mobileMenu) return;

  const closeMenu = () => {
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
  };

  menuBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    mobileMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");
    menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

export function renderKcFooter() {
  return `
    <footer class="kc-footer">
      <p>© ${new Date().getFullYear()} KashmirConnect · Built with ❤️ for Kashmir</p>
      <p><a href="/">Home</a> · <a href="/explore">Explore</a> · <a href="/app.html">Dashboard</a></p>
    </footer>
  `;
}
