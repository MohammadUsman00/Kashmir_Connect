import { escapeHtml } from "../lib/escape.js";

export function renderSettingsView({ theme, role }) {
  return `
    <section class="panel">
      <span class="section-label">Preferences</span>
      <h2>Settings</h2>
      <div class="settings-block">
        <h3>Appearance</h3>
        <label class="toggle-row">
          <span>Dark mode</span>
          <input type="checkbox" id="theme-toggle" ${theme === "dark" ? "checked" : ""} />
        </label>
      </div>
      <div class="settings-block">
        <h3>Account</h3>
        <p class="hint">Role: <strong>${escapeHtml(role || "user")}</strong></p>
        <p class="hint">Set admin access in Supabase: <code>app_metadata.role = "admin"</code></p>
      </div>
      <div class="settings-block">
        <h3>Quick links</h3>
        <p><a href="/explore" target="_blank" rel="noopener">Explore marketplace</a></p>
        <p><a href="/" target="_blank" rel="noopener">Public landing page</a></p>
      </div>
    </section>
  `;
}
