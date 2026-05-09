export function renderAppShell({ userEmail }) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <h1>KashmirConnect Dashboard</h1>
          <p>Manage storefront, products, AI advisor, badges and analytics.</p>
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
      </nav>
      <main id="view-root" class="view-root"></main>
    </div>
  `;
}

export function renderAuthScreen() {
  return `
    <div class="auth-shell">
      <section class="panel">
        <h2>Welcome to KashmirConnect</h2>
        <p>Use your account to manage your digital storefront.</p>
        <div class="auth-grid">
          <form id="login-form" class="panel-form">
            <h3>Login</h3>
            <input required name="email" type="email" placeholder="Email" />
            <input required name="password" type="password" placeholder="Password" />
            <button class="btn">Login</button>
          </form>
          <form id="register-form" class="panel-form">
            <h3>Register</h3>
            <input required name="full_name" type="text" placeholder="Full name" />
            <input required name="email" type="email" placeholder="Email" />
            <input required name="password" type="password" placeholder="Password (min 6 chars)" />
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
      </section>
    </div>
  `;
}
