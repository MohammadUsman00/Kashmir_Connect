import { renderKcNav } from "../ui/kcNav.js";

export function renderAppShell({ userEmail, isAdmin = false }) {
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
          <p>Manage your storefront, products, AI advisor, badges &amp; analytics.</p>
        </div>
        <div class="topbar-right">
          <span class="chip">${userEmail || "User"}</span>
          <button id="logout-btn" class="btn btn-outline">Logout</button>
        </div>
      </header>
      <nav class="tabs">
        <button data-tab="profile" class="tab active">Profile</button>
        <button data-tab="storefront" class="tab">Storefront</button>
        <button data-tab="products" class="tab">Products</button>
        <button data-tab="advisor" class="tab">AI Advisor</button>
        <button data-tab="badges" class="tab">Badges</button>
        <button data-tab="analytics" class="tab">Analytics</button>
        ${isAdmin ? '<button data-tab="admin" class="tab">Admin</button>' : ""}
        <button data-tab="settings" class="tab">Settings</button>
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
        { href: "/explore", label: "Explore", active: false },
      ],
      showDashboard: false,
    })}
    <div class="auth-shell">
      <section class="panel">
        <span class="section-label">Welcome</span>
        <h2>Sign in to your business</h2>
        <p class="hint">Create and manage your digital storefront on KashmirConnect.</p>
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
          </form>
          <form id="register-form" class="panel-form">
            <h3 class="kc-serif" style="margin:0;font-size:1.1rem">Register</h3>
            <input required name="full_name" type="text" placeholder="Full name" />
            <input required name="email" type="email" placeholder="Email" />
            <div class="password-field">
              <input required name="password" type="password" placeholder="Password (min 6 chars)" />
              <button type="button" class="btn btn-outline btn-sm toggle-password">Show</button>
            </div>
            <input name="phone" type="text" placeholder="Phone (optional)" />
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
        <p class="hint" style="margin-top:14px"><a href="/explore">Browse verified businesses</a> · <a href="/">Back to home</a></p>
      </section>
    </div>
  `;
}
