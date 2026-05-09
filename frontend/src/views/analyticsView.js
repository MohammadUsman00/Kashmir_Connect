export function renderAnalyticsView(analytics) {
  if (!analytics) {
    return `<section class="panel"><h2>Analytics</h2><p>No analytics available yet.</p></section>`;
  }

  return `
    <section class="panel">
      <h2>Analytics Summary</h2>
      <div class="kpis">
        <div class="kpi"><span>Total Views</span><strong>${analytics.total_views}</strong></div>
        <div class="kpi"><span>Views This Month</span><strong>${analytics.views_this_month}</strong></div>
        <div class="kpi"><span>WhatsApp Clicks</span><strong>${analytics.whatsapp_clicks}</strong></div>
        <div class="kpi"><span>Badge Scans</span><strong>${analytics.badge_scans}</strong></div>
      </div>
      <h3>Top Products</h3>
      <ul>
        ${(analytics.top_products || []).map((item) => `<li>${item.name}: ${item.views} views</li>`).join("") || "<li>No product views yet</li>"}
      </ul>
    </section>
  `;
}
