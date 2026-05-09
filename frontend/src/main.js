import "./styles/app.css";
import { login, logout, register, getMe, updateProfile } from "./services/authService.js";
import {
  createStorefront,
  getMyStorefront,
  updateStorefront,
  uploadStorefrontImage,
} from "./services/storefrontService.js";
import { createProduct, deleteProduct, uploadProductImage } from "./services/productsService.js";
import { streamAdvisorChat } from "./services/advisorService.js";
import { generateBadgeQr, getMyBadge, requestBadge } from "./services/badgeService.js";
import { getMyAnalytics } from "./services/analyticsService.js";
import { clearSession, getToken, getUser } from "./state/session.js";
import { renderAnalyticsView } from "./views/analyticsView.js";
import { renderAdvisorView } from "./views/advisorView.js";
import { renderBadgesView } from "./views/badgesView.js";
import { renderAppShell, renderAuthScreen } from "./views/layout.js";
import { renderProductsView } from "./views/productsView.js";
import { renderProfileView } from "./views/profileView.js";
import { renderStorefrontView } from "./views/storefrontView.js";
import { showToast } from "./ui/toast.js";

const root = document.getElementById("app");
const state = {
  activeTab: "profile",
  demoMode: false,
  profile: null,
  storefrontData: null,
  badge: null,
  analytics: null,
};

function toObject(formElement) {
  const data = new FormData(formElement);
  const payload = Object.fromEntries(data.entries());
  Object.keys(payload).forEach((k) => {
    if (payload[k] === "") delete payload[k];
  });
  return payload;
}

async function hydrateData() {
  state.profile = await getMe();
  state.storefrontData = await getMyStorefront();
  state.badge = await getMyBadge();
  state.analytics = await getMyAnalytics().catch(() => null);
}

function hydrateDemoData() {
  state.profile = {
    full_name: "Demo User",
    phone: "+91-9900000000",
    business_name: "Demo Kashmir Crafts",
    district: "Srinagar",
    sector: "handicrafts",
    bio: "Sample profile for frontend preview mode.",
  };
  state.storefrontData = {
    storefront: {
      id: "00000000-0000-0000-0000-000000000001",
      business_name: "Demo Kashmir Crafts",
      tagline: "Authentic handmade products",
      description: "This is preview data shown without backend login.",
      sector: "handicrafts",
      district: "Srinagar",
      phone: "+91-9900000000",
      whatsapp: "+91-9900000000",
      email: "demo@kashmirconnect.in",
      instagram: "@demo_kashmircrafts",
      public_url: "kashmirconnect.in/s/demo-kashmir-crafts",
    },
    products: [
      { id: "p1", name: "Pashmina Shawl", description: "Soft handwoven shawl", price: 4500, price_unit: "piece" },
      { id: "p2", name: "Kashmiri Carpet", description: "Traditional hand-knotted carpet", price: 18000, price_unit: "piece" },
    ],
  };
  state.badge = {
    badge_code: "KCDEMO1",
    status: "verified",
    qr_code_url: "https://example.com/demo-qr.png",
  };
  state.analytics = {
    total_views: 342,
    views_this_month: 89,
    whatsapp_clicks: 23,
    badge_scans: 12,
    top_products: [
      { name: "Pashmina Shawl", views: 33 },
      { name: "Kashmiri Carpet", views: 21 },
    ],
  };
}

function demoGuard(event) {
  if (!state.demoMode) return false;
  event?.preventDefault?.();
  showToast("Preview mode is read-only. Login to use live APIs.", "info");
  return true;
}

function mountToastRoot() {
  if (!document.getElementById("toast-root")) {
    const toastRoot = document.createElement("div");
    toastRoot.id = "toast-root";
    document.body.appendChild(toastRoot);
  }
}

function bindAuthActions() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const demoBtn = document.getElementById("demo-mode-btn");

  demoBtn?.addEventListener("click", async () => {
    state.demoMode = true;
    showToast("Opened frontend in demo preview mode", "success");
    await renderApp();
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await login(toObject(loginForm));
      showToast("Logged in", "success");
      await renderApp();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await register(toObject(registerForm));
      showToast("Registered successfully", "success");
      await renderApp();
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

function bindGlobalActions() {
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    if (state.demoMode) {
      state.demoMode = false;
      showToast("Exited demo mode", "info");
      await renderApp();
      return;
    }
    await logout();
    showToast("Logged out", "info");
    await renderApp();
  });

  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      button.classList.add("active");
      renderActiveTab();
    });
  });
}

function bindProfileActions() {
  document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    try {
      await updateProfile(toObject(e.target));
      await hydrateData();
      showToast("Profile updated", "success");
      renderActiveTab();
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

function bindStorefrontActions() {
  document.getElementById("create-storefront-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    try {
      await createStorefront(toObject(e.target));
      await hydrateData();
      showToast("Storefront created", "success");
      renderActiveTab();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("update-storefront-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    const storefrontId = e.target.dataset.id;
    try {
      await updateStorefront(storefrontId, toObject(e.target));
      await hydrateData();
      showToast("Storefront updated", "success");
      renderActiveTab();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("upload-cover-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    const storefrontId = e.target.dataset.id;
    const file = e.target.cover.files[0];
    if (!file) return;
    try {
      await uploadStorefrontImage(storefrontId, file, "cover");
      showToast("Cover image uploaded", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("upload-logo-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    const storefrontId = e.target.dataset.id;
    const file = e.target.logo.files[0];
    if (!file) return;
    try {
      await uploadStorefrontImage(storefrontId, file, "logo");
      showToast("Logo uploaded", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

function bindProductsActions() {
  document.getElementById("create-product-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    const storefrontId = e.target.dataset.storefrontId;
    const payload = toObject(e.target);
    if (payload.price) payload.price = Number(payload.price);
    try {
      await createProduct({ ...payload, storefront_id: storefrontId });
      await hydrateData();
      showToast("Product created", "success");
      renderActiveTab();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) {
        showToast("Preview mode is read-only. Login to use live APIs.", "info");
        return;
      }
      try {
        await deleteProduct(button.dataset.deleteProduct);
        await hydrateData();
        showToast("Product deleted", "success");
        renderActiveTab();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("form[data-upload-product-image]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      if (demoGuard(e)) return;
      e.preventDefault();
      const productId = form.dataset.uploadProductImage;
      const file = form.querySelector('input[name="image"]').files[0];
      if (!file) return;
      try {
        await uploadProductImage(productId, file);
        showToast("Product image uploaded", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}

function bindAdvisorActions() {
  const form = document.getElementById("advisor-form");
  const output = document.getElementById("advisor-output");
  if (!form || !output) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = toObject(form);
    output.textContent = "Thinking...\n";

    if (state.demoMode) {
      output.textContent +=
        "This is demo mode. For live AI advice, login and connect backend env keys.\n\nTip: Start with one product, post storefront link on WhatsApp groups, and track clicks in Analytics.";
      return;
    }

    try {
      await streamAdvisorChat(payload, {
        onChunk: (text) => {
          output.textContent += text;
          output.scrollTop = output.scrollHeight;
        },
        onDone: (final) => {
          output.textContent += `\n\n[Used ${final.queries_used}/${final.queries_limit} free monthly queries]`;
        },
      });
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

function bindBadgeActions() {
  document.getElementById("badge-request-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    const storefrontId = e.target.dataset.storefrontId;
    const payload = toObject(e.target);
    payload.years_in_business = Number(payload.years_in_business || 0);
    try {
      await requestBadge({ ...payload, storefront_id: storefrontId });
      await hydrateData();
      showToast("Badge request submitted", "success");
      renderActiveTab();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("generate-qr-btn")?.addEventListener("click", async (e) => {
    if (state.demoMode) {
      showToast("Preview mode is read-only. Login to use live APIs.", "info");
      return;
    }
    try {
      await generateBadgeQr(e.target.dataset.badgeCode);
      await hydrateData();
      showToast("QR generated", "success");
      renderActiveTab();
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

function bindActiveTabActions() {
  if (state.activeTab === "profile") bindProfileActions();
  if (state.activeTab === "storefront") bindStorefrontActions();
  if (state.activeTab === "products") bindProductsActions();
  if (state.activeTab === "advisor") bindAdvisorActions();
  if (state.activeTab === "badges") bindBadgeActions();
}

function renderActiveTab() {
  const viewRoot = document.getElementById("view-root");
  if (!viewRoot) return;

  if (state.activeTab === "profile") viewRoot.innerHTML = renderProfileView(state.profile);
  if (state.activeTab === "storefront") viewRoot.innerHTML = renderStorefrontView(state.storefrontData);
  if (state.activeTab === "products")
    viewRoot.innerHTML = renderProductsView(state.storefrontData?.storefront, state.storefrontData?.products || []);
  if (state.activeTab === "advisor") viewRoot.innerHTML = renderAdvisorView();
  if (state.activeTab === "badges") viewRoot.innerHTML = renderBadgesView(state.storefrontData?.storefront, state.badge);
  if (state.activeTab === "analytics") viewRoot.innerHTML = renderAnalyticsView(state.analytics);

  bindActiveTabActions();
}

async function renderApp() {
  mountToastRoot();

  if (!getToken() && !state.demoMode) {
    root.innerHTML = renderAuthScreen();
    bindAuthActions();
    return;
  }

  if (state.demoMode) {
    hydrateDemoData();
  } else {
    try {
      await hydrateData();
    } catch (error) {
      clearSession();
      showToast(error.message || "Session expired. Login again.", "error");
      root.innerHTML = renderAuthScreen();
      bindAuthActions();
      return;
    }
  }

  root.innerHTML = renderAppShell({ userEmail: state.demoMode ? "demo@preview.local" : getUser()?.email });
  bindGlobalActions();
  renderActiveTab();
}

renderApp();
