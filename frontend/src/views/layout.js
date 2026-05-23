import { t } from "../lib/i18n.js";
import { renderKcNav } from "../ui/kcNav.js";

export function renderAppShell({ userEmail, isAdmin = false, unreadNotifications = 0 }) {
  return `
    ${renderKcNav({
      links: [
        { href: "/", label: "Home" },
        { href: "/explore", label: "Explore" },
      ],
      showDashboard: false,
    })}
    <div class="dashboard-wrap">
      <header class="dashboard-header">
        <div>
          <span class="section-label">Dashboard</span>
          <h1>KashmirConnect</h1>
          <p>Manage your business — storefront, leads, orders &amp; more. 100% free.</p>
        </div>
        <div class="topbar-right">
          <button type="button" id="notifications-btn" class="btn btn-outline btn-sm" title="${t("notifications")}">
            🔔 ${unreadNotifications > 0 ? `<span class="chip">${unreadNotifications}</span>` : ""}
          </button>
          <span class="chip">${userEmail || "User"}</span>
          <button id="logout-btn" class="btn btn-outline">${t("logout")}</button>
        </div>
      </header>
      <div id="notifications-panel" class="notifications-panel hidden"></div>
      <nav class="tabs">
        <button data-tab="profile" class="tab active">${t("profile")}</button>
        <button data-tab="storefront" class="tab">${t("storefront")}</button>
        <button data-tab="products" class="tab">${t("products")}</button>
        <button data-tab="leads" class="tab">${t("leads")}</button>
        <button data-tab="orders" class="tab">${t("orders")}</button>
        <button data-tab="reviews" class="tab">${t("reviews")}</button>
        <button data-tab="advisor" class="tab">${t("advisor")}</button>
        <button data-tab="badges" class="tab">${t("badges")}</button>
        <button data-tab="analytics" class="tab">${t("analytics")}</button>
        ${isAdmin ? `<button data-tab="admin" class="tab">${t("admin")}</button>` : ""}
        <button data-tab="settings" class="tab">${t("settings")}</button>
      </nav>
      <main id="view-root" class="view-root"></main>
    </div>
  `;
}

export function renderAuthScreen() {
  return `
    ${renderKcNav({
      links: [
        { href: "/", label: "Home" },
        { href: "/explore", label: "Explore" },
      ],
      showDashboard: false,
    })}
    <div class="auth-shell">
      <section class="panel">
        <span class="section-label">Welcome</span>
        <h2>Sign in to your business</h2>
        <p class="hint">Create and manage your digital storefront on KashmirConnect — completely free.</p>
        <div style="margin: 12px 0 16px">
          <button id="demo-mode-btn" class="btn btn-outline">Open Demo Preview (No Login)</button>
        </div>
        <div class="auth-grid">
          <form id="login-form" class="panel-form">
            <h3 class="kc-serif" style="margin:0;font-size:1.1rem">Login</h3>
            <input required name="email" type="email" placeholder="Email" />
            <div class="password-field">
              <input required name="password" type="password" placeholder="Password" />
              <button type="button" class="btn btn-outline btn-sm toggle-password">Show</button>
            </div>
            <button class="btn">Login</button>
            <p class="hint"><a href="#" id="forgot-password-link">Forgot password?</a></p>
          </form>
          <form id="register-form" class="panel-form">
            <h3 class="kc-serif" style="margin:0;font-size:1.1rem">Register</h3>
            <input required name="full_name" type="text" placeholder="Full name" />
            <input required name="email" type="email" placeholder="Email" />
            <input name="phone" type="tel" placeholder="Phone / WhatsApp (recommended)" />
            <div class="password-field">
              <input required name="password" type="password" placeholder="Password (min 6 chars)" />
              <button type="button" class="btn btn-outline btn-sm toggle-password">Show</button>
            </div>
            <input name="business_name" type="text" placeholder="Business name (optional)" />
            <input name="district" type="text" placeholder="District (optional)" />
            <select name="sector">
              <option value="">Select sector (optional)</option>
              <option value="handicrafts">Handicrafts</option>
              <option value="agriculture">Agriculture</option>
              <option value="tourism">Tourism</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>
            <button class="btn">Create account</button>
          </form>
        </div>
        <form id="forgot-password-form" class="form-grid hidden" style="margin-top:1rem">
          <h3 class="kc-serif" style="margin:0;font-size:1.1rem">Reset password</h3>
          <input required name="email" type="email" placeholder="Your email" />
          <button class="btn btn-outline">Send reset link</button>
        </form>
        <form id="reset-password-form" class="form-grid hidden" style="margin-top:1rem">
          <h3 class="kc-serif" style="margin:0;font-size:1.1rem">Set new password</h3>
          <input required name="password" type="password" minlength="6" placeholder="New password" />
          <button class="btn">Update password</button>
        </form>
        <p class="hint" style="margin-top:14px"><a href="/explore">Browse verified businesses</a> · <a href="/">Back to home</a></p>
      </section>
    </div>
  `;
}
