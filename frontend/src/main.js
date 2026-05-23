import "./styles/app.css";
import { consumeAuthHashFromUrl } from "./lib/authHash.js";
import { initTheme, getTheme, toggleTheme } from "./lib/theme.js";
import { buildStorefrontShareText, copyToClipboard, downloadCsv, whatsappShareUrl } from "./lib/share.js";
import { setLang } from "./lib/i18n.js";
import { SECTOR_TEMPLATES, SHARE_TEMPLATES } from "./lib/sectorTemplates.js";
import { login, logout, register, getMe, updateProfile, forgotPassword, updatePassword } from "./services/authService.js";
import {
  createStorefront,
  generateStorefrontShareQr,
  getMyStorefront,
  updateStorefront,
  uploadStorefrontImage,
} from "./services/storefrontService.js";
import {
  createProduct,
  deleteProduct,
  importProductsCsv,
  reorderProducts,
  updateProduct,
  uploadProductGalleryImage,
  uploadProductImage,
} from "./services/productsService.js";
import {
  deleteConversation,
  getConversation,
  listConversations,
  streamAdvisorChat,
} from "./services/advisorService.js";
import {
  adminRejectBadge,
  adminVerifyBadge,
  generateBadgeQr,
  getMyBadge,
  listPendingBadges,
  requestBadge,
} from "./services/badgeService.js";
import { getMyAnalytics } from "./services/analyticsService.js";
import { getMyLeads, updateLeadStatus } from "./services/leadsService.js";
import { getMyOrders, updateOrderStatus } from "./services/ordersService.js";
import { approveReview, getMyReviews } from "./services/reviewsService.js";
import { getMyNotifications, markAllNotificationsRead } from "./services/notificationsService.js";
import { getPlatformStats, listAdminStorefronts, setStorefrontFeatured } from "./services/adminService.js";
import { renderLeadsView } from "./views/leadsView.js";
import { renderOrdersView } from "./views/ordersView.js";
import { renderReviewsManageView } from "./views/reviewsManageView.js";
import { clearSession, getToken, getUser } from "./state/session.js";
import { renderAdminView } from "./views/adminView.js";
import { renderAnalyticsView } from "./views/analyticsView.js";
import { renderAdvisorView } from "./views/advisorView.js";
import { renderBadgesView } from "./views/badgesView.js";
import { renderAppShell, renderAuthScreen } from "./views/layout.js";
import { renderProductsView } from "./views/productsView.js";
import { renderProfileView } from "./views/profileView.js";
import { renderSettingsView } from "./views/settingsView.js";
import { renderStorefrontView } from "./views/storefrontView.js";
import { getOnboardingStep, renderOnboardingBanner } from "./views/onboardingView.js";
import { bindKcNav } from "./ui/kcNav.js";
import { showToast } from "./ui/toast.js";

const authFromHash = consumeAuthHashFromUrl();
const passwordRecoveryMode = authFromHash?.type === "recovery";

initTheme();

const root = document.getElementById("app");
const state = {
  activeTab: "profile",
  demoMode: false,
  profile: null,
  storefrontData: null,
  badge: null,
  analytics: null,
  advisorConversations: [],
  activeConversationId: null,
  pendingBadges: [],
  leads: [],
  orders: [],
  reviews: [],
  notifications: { items: [], unread: 0 },
  adminStorefronts: [],
  adminStats: null,
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
  if (state.profile?.preferred_language) setLang(state.profile.preferred_language);
  state.storefrontData = await getMyStorefront();
  state.badge = await getMyBadge();
  state.analytics = await getMyAnalytics().catch(() => null);
  state.leads = await getMyLeads().catch(() => []);
  state.orders = await getMyOrders().catch(() => []);
  state.reviews = await getMyReviews().catch(() => []);
  state.notifications = await getMyNotifications().catch(() => ({ items: [], unread: 0 }));
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
      slug: "demo-kashmir-crafts",
      is_active: true,
      is_verified: true,
      view_count: 342,
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
    views_by_day: [
      { day: "2026-05-17", views: 12 },
      { day: "2026-05-18", views: 18 },
      { day: "2026-05-19", views: 9 },
      { day: "2026-05-20", views: 22 },
      { day: "2026-05-21", views: 15 },
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

function bindPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement?.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
    });
  });
}

function bindAuthActions() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const demoBtn = document.getElementById("demo-mode-btn");

  bindPasswordToggles();

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

  document.getElementById("forgot-password-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("forgot-password-form")?.classList.remove("hidden");
  });

  document.getElementById("forgot-password-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(e.target.email.value);
      showToast("If that email exists, a reset link was sent.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  if (passwordRecoveryMode) {
    document.getElementById("reset-password-form")?.classList.remove("hidden");
    document.getElementById("forgot-password-form")?.classList.add("hidden");
    document.querySelector(".auth-grid")?.classList.add("hidden");
  }

  document.getElementById("reset-password-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await updatePassword(e.target.password.value);
      showToast("Password updated. You can log in now.", "success");
      e.target.reset();
      if (passwordRecoveryMode) {
        window.location.reload();
      }
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
  document.getElementById("apply-sector-template")?.addEventListener("click", () => {
    const key = document.getElementById("sector-template-select")?.value;
    const template = SECTOR_TEMPLATES[key];
    const form = document.getElementById("create-storefront-form");
    if (!template || !form) {
      showToast("Select a sector template first", "info");
      return;
    }
    Object.entries(template).forEach(([k, v]) => {
      if (k === "products") return;
      const field = form.querySelector(`[name="${k}"]`);
      if (field) field.value = v;
    });
    form.dataset.templateProducts = JSON.stringify(template.products || []);
    showToast("Template applied — create storefront to add sample products", "success");
  });

  document.getElementById("create-storefront-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    try {
      const created = await createStorefront(toObject(e.target));
      const templateProducts = e.target.dataset.templateProducts;
      if (templateProducts && created?.id) {
        const products = JSON.parse(templateProducts);
        for (const p of products) {
          await createProduct({ ...p, storefront_id: created.id, price: Number(p.price) });
        }
      }
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

  document.getElementById("copy-storefront-link")?.addEventListener("click", async () => {
    const url = document.getElementById("copy-storefront-link")?.dataset.url;
    if (!url) return;
    try {
      await copyToClipboard(url);
      showToast("Storefront link copied", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  });

  document.getElementById("share-whatsapp-storefront")?.addEventListener("click", () => {
    const btn = document.getElementById("share-whatsapp-storefront");
    const text = buildStorefrontShareText(btn.dataset.name, btn.dataset.url);
    window.open(whatsappShareUrl(text), "_blank", "noopener");
  });

  document.getElementById("generate-storefront-qr")?.addEventListener("click", async () => {
    if (demoGuard()) return;
    const id = document.getElementById("generate-storefront-qr")?.dataset.id;
    try {
      const result = await generateStorefrontShareQr(id);
      const preview = document.getElementById("storefront-qr-preview");
      if (preview) {
        preview.innerHTML = `<img class="qr-img" src="${result.qr_code_url}" alt="QR code" /><p class="hint"><a href="${result.share_url}" target="_blank" rel="noopener">${result.share_url}</a></p>`;
      }
      showToast("Storefront QR generated", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  const shareKit = document.getElementById("share-kit-chips");
  const publicUrl = document.getElementById("copy-storefront-link")?.dataset.url;
  if (shareKit && publicUrl) {
    const lang = localStorage.getItem("kc-lang") === "ur" ? "ur" : "en";
    shareKit.innerHTML = SHARE_TEMPLATES.map(
      (t) =>
        `<button type="button" class="prompt-chip" data-share-msg="${encodeURIComponent(`${t[lang]} ${publicUrl}`)}">${t.label}</button>`
    ).join("");
    shareKit.querySelectorAll("[data-share-msg]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.open(`https://wa.me/?text=${btn.dataset.shareMsg}`, "_blank", "noopener");
      });
    });
  }

  document.getElementById("toggle-publish-storefront")?.addEventListener("click", async () => {
    if (demoGuard()) return;
    const btn = document.getElementById("toggle-publish-storefront");
    const id = btn.dataset.id;
    const publish = btn.dataset.active !== "true";
    try {
      await updateStorefront(id, { is_active: publish });
      await hydrateData();
      showToast(publish ? "Storefront published" : "Storefront unpublished", "success");
      renderActiveTab();
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

async function moveProduct(productId, direction) {
  const products = [...(state.storefrontData?.products || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  const index = products.findIndex((p) => p.id === productId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= products.length) return;

  [products[index], products[swapIndex]] = [products[swapIndex], products[index]];
  const payload = products.map((p, i) => ({ id: p.id, sort_order: i }));
  await reorderProducts(payload);
  await hydrateData();
  showToast("Product order updated", "success");
  renderActiveTab();
}

function bindProductsActions() {
  document.getElementById("create-product-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    const storefrontId = e.target.dataset.storefrontId;
    const payload = toObject(e.target);
    if (payload.price) payload.price = Number(payload.price);
    if (payload.stock_count) payload.stock_count = Number(payload.stock_count);
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

  document.querySelectorAll("[data-move-up]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) {
        showToast("Preview mode is read-only.", "info");
        return;
      }
      try {
        await moveProduct(button.dataset.moveUp, "up");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-move-down]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) {
        showToast("Preview mode is read-only.", "info");
        return;
      }
      try {
        await moveProduct(button.dataset.moveDown, "down");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll(".edit-product-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      if (demoGuard(e)) return;
      e.preventDefault();
      const productId = form.dataset.editProduct;
      const payload = toObject(form);
      payload.is_available = form.querySelector('[name="is_available"]')?.checked ?? true;
      if (payload.price !== undefined && payload.price !== "") payload.price = Number(payload.price);
      else delete payload.price;
      if (payload.stock_count !== undefined && payload.stock_count !== "") payload.stock_count = Number(payload.stock_count);
      else delete payload.stock_count;
      try {
        await updateProduct(productId, payload);
        await hydrateData();
        showToast("Product updated", "success");
        renderActiveTab();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.getElementById("import-csv-btn")?.addEventListener("click", async () => {
    if (state.demoMode) return;
    const csv = document.getElementById("products-csv")?.value;
    const storefrontId = state.storefrontData?.storefront?.id;
    if (!csv || !storefrontId) return;
    try {
      const result = await importProductsCsv(storefrontId, csv);
      await hydrateData();
      showToast(`Imported ${result.imported} products`, "success");
      renderActiveTab();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.querySelectorAll("form[data-gallery-upload]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      if (demoGuard(e)) return;
      e.preventDefault();
      const productId = form.dataset.galleryUpload;
      const file = form.querySelector('input[type="file"]').files[0];
      if (!file) return;
      try {
        await uploadProductGalleryImage(productId, file);
        showToast("Gallery image added", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}

function formatMessages(messages = []) {
  return messages
    .map((m) => `${m.role === "user" ? "You" : "Advisor"}: ${m.content}`)
    .join("\n\n");
}

function bindAdvisorActions() {
  const form = document.getElementById("advisor-form");
  const output = document.getElementById("advisor-output");
  if (!form || !output) return;

  document.querySelectorAll(".prompt-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const textarea = form.querySelector('textarea[name="message"]');
      if (textarea) textarea.value = chip.dataset.prompt || "";
    });
  });

  async function removeConversation(id) {
    if (!id || state.demoMode) return;
    await deleteConversation(id);
    state.advisorConversations = await listConversations().catch(() => []);
    if (state.activeConversationId === id) {
      state.activeConversationId = null;
      output.textContent = "";
      document.getElementById("conversation-id").value = "";
    }
    if (state.activeTab === "advisor") {
      document.getElementById("view-root").innerHTML = renderAdvisorView({
        conversations: state.advisorConversations,
        activeConversationId: state.activeConversationId,
      });
      bindAdvisorActions();
    }
    showToast("Conversation deleted", "info");
  }

  document.getElementById("new-conversation-btn")?.addEventListener("click", () => {
    state.activeConversationId = null;
    const hidden = document.getElementById("conversation-id");
    if (hidden) hidden.value = "";
    output.textContent = "";
    document.querySelectorAll(".conv-row").forEach((el) => el.classList.remove("active"));
  });

  document.getElementById("delete-active-conversation")?.addEventListener("click", async () => {
    if (!state.activeConversationId) return;
    try {
      await removeConversation(state.activeConversationId);
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.querySelectorAll("[data-delete-conversation]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        await removeConversation(button.dataset.deleteConversation);
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-load-conversation]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) {
        showToast("Conversation history requires login.", "info");
        return;
      }
      try {
        const conv = await getConversation(button.dataset.loadConversation);
        state.activeConversationId = conv.id;
        document.getElementById("conversation-id").value = conv.id;
        output.textContent = formatMessages(conv.messages || []);
        document.querySelectorAll(".conv-row").forEach((el) => el.classList.remove("active"));
        button.closest(".conv-row")?.classList.add("active");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = toObject(form);
    if (!payload.conversation_id) delete payload.conversation_id;
    if (state.storefrontData?.storefront?.id) {
      payload.storefront_id = state.storefrontData.storefront.id;
    }
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
        onDone: async (final) => {
          output.textContent += `\n\n[Used ${final.queries_used}/${final.queries_limit} free monthly queries]`;
          if (final.conversation_id) {
            state.activeConversationId = final.conversation_id;
            document.getElementById("conversation-id").value = final.conversation_id;
          }
          state.advisorConversations = await listConversations().catch(() => []);
          const viewRoot = document.getElementById("view-root");
          if (viewRoot && state.activeTab === "advisor") {
            viewRoot.innerHTML = renderAdvisorView({
              conversations: state.advisorConversations,
              activeConversationId: state.activeConversationId,
            });
            bindAdvisorActions();
          }
        },
      });
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

function bindOnboarding() {
  document.getElementById("dismiss-onboarding")?.addEventListener("click", () => {
    localStorage.setItem("kc-onboarding-dismissed", "1");
    document.getElementById("onboarding-banner")?.remove();
  });

  document.querySelectorAll("[data-onboarding-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.onboardingTab;
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.tab === state.activeTab);
      });
      renderActiveTab();
    });
  });
}

function mountOnboarding() {
  if (state.demoMode || localStorage.getItem("kc-onboarding-dismissed")) return;
  const step = getOnboardingStep(state.profile, state.storefrontData);
  if (step > 4) return;

  const shell = document.querySelector(".app-shell");
  if (!shell) return;
  shell.insertAdjacentHTML("afterbegin", renderOnboardingBanner(step, state.storefrontData?.storefront));
  bindOnboarding();
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

function bindAnalyticsActions() {
  document.getElementById("export-analytics-csv")?.addEventListener("click", () => {
    const a = state.analytics;
    if (!a) return;
    downloadCsv("kashmirconnect-analytics.csv", [
      ["Metric", "Value"],
      ["Total views", a.total_views],
      ["Views this month", a.views_this_month],
      ["WhatsApp clicks", a.whatsapp_clicks],
      ["Badge scans", a.badge_scans],
      [],
      ["Day", "Views"],
      ...(a.views_by_day || []).map((d) => [d.day, d.views]),
      [],
      ["Product", "Views"],
      ...(a.top_products || []).map((p) => [p.name, p.views]),
    ]);
    showToast("Analytics exported", "success");
  });
}

function bindSettingsActions() {
  document.getElementById("theme-toggle")?.addEventListener("change", () => {
    toggleTheme();
    showToast(`Switched to ${getTheme()} mode`, "info");
  });

  document.getElementById("language-select")?.addEventListener("change", async (e) => {
    setLang(e.target.value);
    if (!state.demoMode) {
      await updateProfile({ preferred_language: e.target.value }).catch(() => {});
    }
    showToast("Language updated", "success");
    await renderApp();
  });

  document.getElementById("update-password-form")?.addEventListener("submit", async (e) => {
    if (demoGuard(e)) return;
    e.preventDefault();
    try {
      await updatePassword(e.target.password.value);
      showToast("Password updated", "success");
      e.target.reset();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.getElementById("install-pwa-btn")?.addEventListener("click", async () => {
    if (window.deferredPwaPrompt) {
      window.deferredPwaPrompt.prompt();
      await window.deferredPwaPrompt.userChoice;
      window.deferredPwaPrompt = null;
    } else {
      showToast("Install from browser menu → Add to Home Screen", "info");
    }
  });
}

function bindNotificationsUi() {
  const panel = document.getElementById("notifications-panel");
  const btn = document.getElementById("notifications-btn");
  if (!btn || !panel) return;

  const renderPanel = () => {
    const items = state.notifications.items || [];
    panel.innerHTML =
      items.length === 0
        ? `<p class="hint">No notifications yet.</p>`
        : items
            .map((n) => `<div class="notif-item"><strong>${n.title}</strong><br/><span class="hint">${n.body || ""}</span></div>`)
            .join("") + `<button type="button" class="btn btn-outline btn-sm" id="mark-all-read" style="margin-top:8px">Mark all read</button>`;
    panel.classList.toggle("hidden", !panel.dataset.open);
  };

  btn.addEventListener("click", () => {
    panel.dataset.open = panel.dataset.open === "1" ? "0" : "1";
    renderPanel();
  });

  panel.addEventListener("click", async (e) => {
    if (e.target.id === "mark-all-read" && !state.demoMode) {
      await markAllNotificationsRead();
      state.notifications = await getMyNotifications();
      renderPanel();
    }
  });
}

function bindLeadsActions() {
  document.querySelectorAll("[data-lead-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      if (state.demoMode) return;
      try {
        await updateLeadStatus(select.dataset.leadStatus, select.value);
        showToast("Lead updated", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}

function bindOrdersActions() {
  document.querySelectorAll("[data-order-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      if (state.demoMode) return;
      try {
        await updateOrderStatus(select.dataset.orderStatus, select.value);
        showToast("Order updated", "success");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}

function bindReviewsManageActions() {
  document.querySelectorAll("[data-approve-review]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) return;
      try {
        await approveReview(button.dataset.approveReview, true);
        state.reviews = await getMyReviews();
        showToast("Review published", "success");
        renderActiveTab();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
  document.querySelectorAll("[data-hide-review]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) return;
      try {
        await approveReview(button.dataset.hideReview, false);
        state.reviews = await getMyReviews();
        showToast("Review hidden", "info");
        renderActiveTab();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}

function bindAdminActions() {
  document.querySelectorAll("[data-approve-badge]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) return;
      try {
        await adminVerifyBadge(button.dataset.approveBadge);
        state.pendingBadges = (await listPendingBadges()).items || [];
        showToast("Badge approved", "success");
        renderActiveTab();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-reject-badge]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) return;
      const reason = window.prompt("Rejection reason for the business:");
      if (!reason) return;
      try {
        await adminRejectBadge(button.dataset.rejectBadge, reason);
        state.pendingBadges = (await listPendingBadges()).items || [];
        showToast("Badge rejected", "info");
        renderActiveTab();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-toggle-featured]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.demoMode) return;
      const id = button.dataset.toggleFeatured;
      const next = button.dataset.featured !== "true";
      try {
        await setStorefrontFeatured(id, next);
        showToast(next ? "Storefront featured" : "Removed from featured", "success");
        renderActiveTab();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}

function bindActiveTabActions() {
  if (state.activeTab === "profile") bindProfileActions();
  if (state.activeTab === "storefront") bindStorefrontActions();
  if (state.activeTab === "products") bindProductsActions();
  if (state.activeTab === "leads") bindLeadsActions();
  if (state.activeTab === "orders") bindOrdersActions();
  if (state.activeTab === "reviews") bindReviewsManageActions();
  if (state.activeTab === "advisor") bindAdvisorActions();
  if (state.activeTab === "badges") bindBadgeActions();
  if (state.activeTab === "analytics") bindAnalyticsActions();
  if (state.activeTab === "settings") bindSettingsActions();
  if (state.activeTab === "admin") bindAdminActions();
}

async function renderActiveTab() {
  const viewRoot = document.getElementById("view-root");
  if (!viewRoot) return;

  if (state.activeTab === "profile") viewRoot.innerHTML = renderProfileView(state.profile);
  if (state.activeTab === "storefront") viewRoot.innerHTML = renderStorefrontView(state.storefrontData);
  if (state.activeTab === "products")
    viewRoot.innerHTML = renderProductsView(state.storefrontData?.storefront, state.storefrontData?.products || []);
  if (state.activeTab === "leads") viewRoot.innerHTML = renderLeadsView(state.leads);
  if (state.activeTab === "orders") viewRoot.innerHTML = renderOrdersView(state.orders);
  if (state.activeTab === "reviews") viewRoot.innerHTML = renderReviewsManageView(state.reviews);
  if (state.activeTab === "advisor") {
    if (!state.demoMode) {
      state.advisorConversations = await listConversations().catch(() => []);
    }
    viewRoot.innerHTML = renderAdvisorView({
      conversations: state.advisorConversations,
      activeConversationId: state.activeConversationId,
    });
  }
  if (state.activeTab === "badges") viewRoot.innerHTML = renderBadgesView(state.storefrontData?.storefront, state.badge);
  if (state.activeTab === "analytics") viewRoot.innerHTML = renderAnalyticsView(state.analytics);
  if (state.activeTab === "settings") {
    viewRoot.innerHTML = renderSettingsView({ theme: getTheme(), role: state.profile?.role });
  }
  if (state.activeTab === "admin") {
    if (!state.demoMode && state.profile?.role === "admin") {
      const [badges, storefronts, stats] = await Promise.all([
        listPendingBadges().catch(() => ({ items: [] })),
        listAdminStorefronts().catch(() => ({ items: [] })),
        getPlatformStats().catch(() => null),
      ]);
      state.pendingBadges = badges.items || [];
      state.adminStorefronts = storefronts.items || [];
      state.adminStats = stats;
    }
    viewRoot.innerHTML = renderAdminView({
      pendingBadges: state.pendingBadges,
      storefronts: state.adminStorefronts,
      stats: state.adminStats,
    });
  }

  bindActiveTabActions();
}

async function renderApp() {
  mountToastRoot();

  if ((!getToken() && !state.demoMode) || passwordRecoveryMode) {
    root.innerHTML = renderAuthScreen();
    bindKcNav();
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
      bindKcNav();
      bindAuthActions();
      return;
    }
  }

  root.innerHTML = renderAppShell({
    userEmail: state.demoMode ? "demo@preview.local" : getUser()?.email,
    isAdmin: !state.demoMode && state.profile?.role === "admin",
    unreadNotifications: state.notifications?.unread || 0,
  });
  bindKcNav();
  bindGlobalActions();
  bindNotificationsUi();
  mountOnboarding();
  await renderActiveTab();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredPwaPrompt = e;
});

renderApp();
