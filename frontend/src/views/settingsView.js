import { escapeHtml } from "../lib/escape.js";
import { getLang } from "../lib/i18n.js";

export function renderSettingsView({ theme, role }) {
  const lang = getLang();
  return `
    <section class="panel">
      <span class="section-label">Preferences</span>
      <h2>Settings</h2>
      <div class="settings-block">
        <h3>Language / زبان</h3>
        <select id="language-select">
          <option value="en" ${lang === "en" ? "selected" : ""}>English</option>
          <option value="ur" ${lang === "ur" ? "selected" : ""}>اردو (Urdu)</option>
        </select>
        <p class="hint">Applies to dashboard labels. AI advisor already responds in your language.</p>
      </div>
      <div class="settings-block">
        <h3>Appearance</h3>
        <label class="toggle-row">
          <span>Dark mode</span>
          <input type="checkbox" id="theme-toggle" ${theme === "dark" ? "checked" : ""} />
        </label>
      </div>
      <div class="settings-block">
        <h3>Password</h3>
        <form id="update-password-form" class="form-grid">
          <input required name="password" type="password" minlength="6" placeholder="New password (min 6 chars)" />
          <button class="btn btn-outline">Update password</button>
        </form>
      </div>
      <div class="settings-block">
        <h3>Account</h3>
        <p class="hint">Role: <strong>${escapeHtml(role || "user")}</strong></p>
        <p class="hint">All KashmirConnect features are free — no paid plans.</p>
      </div>
      <div class="settings-block">
        <h3>Install app</h3>
        <p class="hint">Add KashmirConnect to your home screen for quick access (PWA).</p>
        <button type="button" id="install-pwa-btn" class="btn btn-outline">Install app</button>
      </div>
      <div class="settings-block">
        <h3>Quick links</h3>
        <p><a href="/explore" target="_blank" rel="noopener">Explore marketplace</a></p>
        <p><a href="/" target="_blank" rel="noopener">Public landing page</a></p>
      </div>
    </section>
  `;
}
