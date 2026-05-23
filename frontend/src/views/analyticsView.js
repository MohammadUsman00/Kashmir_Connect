import { escapeHtml } from "../lib/escape.js";

function renderViewsChart(viewsByDay = []) {
  if (!viewsByDay.length) {
    return `<p class="hint">Views chart will appear after you get storefront traffic.</p>`;
  }

  const max = Math.max(...viewsByDay.map((d) => d.views), 1);
  const bars = viewsByDay
    .map((d) => {
      const h = Math.round((d.views / max) * 100);
      return `<div class="chart-bar" style="height:${h}%" title="${escapeHtml(d.day)}: ${d.views}"></div>`;
    })
    .join("");
  const labels = viewsByDay
    .map((d) => `<span>${escapeHtml(d.day.slice(5))}</span>`)
    .join("");

  return `
    <h3>Views (last 30 days)</h3>
    <div class="chart-bars">${bars}</div>
    <div class="chart-labels">${labels}</div>
  `;
}

function buildInsight(analytics) {
  const views = analytics.views_this_month || 0;
  const wa = analytics.whatsapp_clicks || 0;
  if (views === 0) {
    return "Share your storefront link on WhatsApp groups to get your first views.";
  }
  if (wa === 0) {
    return "You have views but no WhatsApp clicks yet — add a clear WhatsApp button and product prices.";
  }
  const rate = Math.round((wa / views) * 100);
  return `About ${rate}% of viewers tapped WhatsApp. Keep your top products updated and reply quickly.`;
}

export function renderAnalyticsView(analytics) {
  if (!analytics) {
    return `<section class="panel"><h2>Analytics</h2><p>No analytics available yet.</p></section>`;
  }

  const conversion =
    analytics.total_views > 0
      ? Math.round((analytics.whatsapp_clicks / analytics.total_views) * 100)
      : 0;

  return `
    <section class="panel">
      <div class="panel-head-row">
        <div>
          <span class="section-label">Insights</span>
          <h2 style="margin:0">Analytics</h2>
        </div>
        <button type="button" id="export-analytics-csv" class="btn btn-outline btn-sm">Export CSV</button>
      </div>
      <div class="kpis">
        <div class="kpi"><span>Total Views</span><strong>${analytics.total_views}</strong></div>
        <div class="kpi"><span>Views This Month</span><strong>${analytics.views_this_month}</strong></div>
        <div class="kpi"><span>WhatsApp Clicks</span><strong>${analytics.whatsapp_clicks}</strong></div>
        <div class="kpi"><span>Badge Scans</span><strong>${analytics.badge_scans}</strong></div>
        <div class="kpi"><span>WhatsApp conversion</span><strong>${conversion}%</strong></div>
      </div>
      ${renderViewsChart(analytics.views_by_day || [])}
      <div class="insight-box">${escapeHtml(buildInsight(analytics))}</div>
      <h3>Top Products</h3>
      <ul>
        ${(analytics.top_products || [])
          .map((item) => `<li>${escapeHtml(item.name)}: ${item.views} views</li>`)
          .join("") || "<li>No product views yet</li>"}
      </ul>
    </section>
  `;
}
