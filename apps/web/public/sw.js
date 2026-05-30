const STATIC_CACHE = "kc-shell-v3";
const PAGE_CACHE = "kc-pages-v3";
const IMAGE_CACHE = "kc-images-v3";
const API_CACHE = "kc-api-v3";
const SOS_QUEUE_DB = "kc-emergency-db";
const SOS_QUEUE_STORE = "sosQueue";
const API_MAX_STALE_MS = 5 * 60 * 1000;
const IMAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const APP_SHELL = ["/", "/map", "/emergency", "/explore", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function openSOSDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SOS_QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SOS_QUEUE_STORE)) {
        db.createObjectStore(SOS_QUEUE_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueSOSRequest(request) {
  const clone = request.clone();
  const payload = await clone.json();
  const db = await openSOSDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(SOS_QUEUE_STORE, "readwrite");
    tx.objectStore(SOS_QUEUE_STORE).put({
      id: crypto.randomUUID(),
      payload,
      createdAt: Date.now()
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function replayQueuedSOS() {
  const db = await openSOSDB();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(SOS_QUEUE_STORE, "readonly");
    const req = tx.objectStore(SOS_QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item.payload, offlineQueued: true })
      });
      await new Promise((resolve, reject) => {
        const tx = db.transaction(SOS_QUEUE_STORE, "readwrite");
        tx.objectStore(SOS_QUEUE_STORE).delete(item.id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Keep queued for next sync cycle.
    }
  }
  db.close();
}

async function cacheFirstImages(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    const cachedAt = Number(cached.headers.get("sw-cached-at") || "0");
    if (Date.now() - cachedAt <= IMAGE_MAX_AGE_MS) return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const withTimestamp = new Response(response.body, response);
      withTimestamp.headers.append("sw-cached-at", String(Date.now()));
      cache.put(request, withTimestamp.clone());
      return withTimestamp;
    }
    return cached || response;
  } catch {
    return cached || caches.match("/offline.html");
  }
}

async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok && request.method === "GET") {
      const stamped = new Response(fresh.body, fresh);
      stamped.headers.append("sw-cached-at", String(Date.now()));
      cache.put(request, stamped.clone());
      return stamped;
    }
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (!cached) return new Response(JSON.stringify({ error: "offline" }), { status: 503 });
    const cachedAt = Number(cached.headers.get("sw-cached-at") || "0");
    if (Date.now() - cachedAt > API_MAX_STALE_MS) return new Response(JSON.stringify({ error: "stale" }), { status: 503 });
    return cached;
  }
}

async function staleWhileRevalidatePages(request) {
  const cache = await caches.open(PAGE_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || caches.match("/offline.html"));
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isImage = event.request.destination === "image";
  const isApi = url.pathname.startsWith("/api/");
  const isSOS = url.pathname === "/api/sos";
  const isPage = event.request.mode === "navigate";

  if (isSOS && event.request.method === "POST") {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        await queueSOSRequest(event.request);
        return new Response(JSON.stringify({ queued: true }), {
          status: 202,
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  if (isApi) {
    event.respondWith(networkFirstApi(event.request));
    return;
  }

  if (isImage) {
    event.respondWith(cacheFirstImages(event.request));
    return;
  }

  if (isPage) {
    event.respondWith(staleWhileRevalidatePages(event.request));
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sos-sync") {
    event.waitUntil(replayQueuedSOS());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "emergency-refresh-6h") {
    event.waitUntil(
      Promise.all([
        fetch("/emergency-reference.json").catch(() => undefined),
        fetch("/api/emergency/alerts").catch(() => undefined)
      ])
    );
  }
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() ?? {};
  const title = payload.title || "Kashmir Connect Alert";
  const body = payload.body || "Important update from Kashmir Connect.";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: payload,
      actions: [
        { action: "open-emergency", title: "Open Emergency" },
        { action: "dismiss", title: "Dismiss" }
      ]
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const targetUrl = event.notification.data?.url || "/emergency";
  event.waitUntil(clients.openWindow(targetUrl));
});
