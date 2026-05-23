import { escapeHtml } from "../lib/escape.js";
import { getStorefrontPath } from "../lib/publicPaths.js";

export function getOnboardingStep(profile, storefrontData) {
  const storefront = storefrontData?.storefront;
  const products = storefrontData?.products || [];
  if (!profile?.full_name || !profile?.business_name) return 1;
  if (!storefront) return 2;
  if (!products.length) return 3;
  return 4;
}

export function renderOnboardingBanner(step, storefront) {
  const slug = storefront?.slug;
  const publicPath = slug ? getStorefrontPath(slug) : "";

  const steps = [
    { n: 1, label: "Complete profile", tab: "profile" },
    { n: 2, label: "Create storefront", tab: "storefront" },
    { n: 3, label: "Add first product", tab: "products" },
    { n: 4, label: "Share your link", tab: "storefront" },
  ];

  return `
    <aside id="onboarding-banner" class="onboarding">
      <div class="onboarding-head">
        <strong>Getting started</strong>
        <button type="button" id="dismiss-onboarding" class="btn btn-outline btn-sm">Dismiss</button>
      </div>
      <ol class="onboarding-steps">
        ${steps
          .map(
            (s) => `
          <li class="${step === s.n ? "active" : step > s.n ? "done" : ""}">
            <button type="button" data-onboarding-tab="${s.tab}">${s.n}. ${s.label}</button>
          </li>
        `
          )
          .join("")}
      </ol>
      ${
        step === 4 && publicPath
          ? `<p class="onboarding-tip">Share: <code>${escapeHtml(window.location.origin + publicPath)}</code></p>`
          : `<p class="onboarding-tip">Step ${step} of 4 — finish setup to go live.</p>`
      }
    </aside>
  `;
}
