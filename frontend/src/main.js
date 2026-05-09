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

  if (!getToken()) {
    root.innerHTML = renderAuthScreen();
    bindAuthActions();
    return;
  }

  try {
    await hydrateData();
  } catch (error) {
    clearSession();
    showToast(error.message || "Session expired. Login again.", "error");
    root.innerHTML = renderAuthScreen();
    bindAuthActions();
    return;
  }

  root.innerHTML = renderAppShell({ userEmail: getUser()?.email });
  bindGlobalActions();
  renderActiveTab();
}

renderApp();
