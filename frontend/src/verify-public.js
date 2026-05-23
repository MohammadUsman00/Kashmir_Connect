import "./styles/public.css";
import { escapeHtml } from "./lib/escape.js";
import { setPageMeta } from "./lib/meta.js";
import { getStorefrontPath, parseVerifyCode } from "./lib/publicPaths.js";
import { verifyBadgeByCode } from "./services/badgeService.js";
import { bindKcNav, renderKcFooter, renderKcNav } from "./ui/kcNav.js";

const root = document.getElementById("app");

async function init() {
  const code = parseVerifyCode();

  root.innerHTML = `
    ${renderKcNav({ links: [{ href: "/", label: "Home" }, { href: "/explore", label: "Explore" }], showDashboard: true })}
    <div class="kc-page">
      <div class="kc-page-hero">
        <span class="section-label">Trust</span>
        <h1>Badge verification</h1>
      </div>
      <div class="pub-card">
        <div id="verify-result" class="verify-box loading">Verifying…</div>
      </div>
      ${renderKcFooter()}
    </div>
  `;

  bindKcNav();

  setPageMeta({
    title: "Verify Badge · KashmirConnect",
    description: "Verify authenticity of a KashmirConnect business badge.",
    url: window.location.href,
  });

  const box = document.getElementById("verify-result");

  if (!code) {
    box.className = "verify-box verify-fail";
    box.innerHTML = "<h2>Invalid link</h2><p class='pub-muted'>No badge code provided.</p>";
    return;
  }

  try {
    const result = await verifyBadgeByCode(code);
    if (!result.verified) {
      box.className = "verify-box verify-fail";
      box.innerHTML = `
        <div class="verify-icon">✗</div>
        <h2>Not verified</h2>
        <p class="pub-muted">${escapeHtml(result.message || "This badge could not be verified.")}</p>
      `;
      return;
    }

    const slugMatch = String(result.storefront_url || "").match(/\/s\/([^/]+)/);
    const storefrontHref = slugMatch ? getStorefrontPath(slugMatch[1]) : "/explore";

    box.className = "verify-box verify-ok";
    box.innerHTML = `
      <div class="verify-icon">✓</div>
      <h2>Verified business</h2>
      <p><strong>${escapeHtml(result.business_name)}</strong></p>
      <p class="pub-muted">Sector: ${escapeHtml(result.sector || "—")}</p>
      <p class="pub-muted">Badge: ${escapeHtml(result.badge_code)}</p>
      ${result.verified_at ? `<p class="pub-muted">Verified: ${escapeHtml(new Date(result.verified_at).toLocaleDateString())}</p>` : ""}
      <p style="margin-top:1.5rem"><a class="pub-btn" href="${escapeHtml(storefrontHref)}">View storefront</a></p>
    `;
    document.title = `Verified · ${result.business_name}`;
  } catch {
    box.className = "verify-box verify-fail";
    box.innerHTML = "<h2>Verification failed</h2><p class='pub-muted'>Please try again later.</p>";
  }
}

init();
