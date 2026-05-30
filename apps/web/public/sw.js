const STATIC_CACHE = "kc-emergency-static-v1";
const DATA_CACHE = "kc-emergency-data-v1";
const SOS_QUEUE_DB = "kc-emergency-db";
const SOS_QUEUE_STORE = "sosQueue";

const EMERGENCY_BOOTSTRAP = [
  "/",
  "/api/emergency/alerts",
  "/api/sos",
  "/emergency-reference.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(EMERGENCY_BOOTSTRAP)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const shouldCache =
    url.pathname.startsWith("/api/emergency/alerts") ||
    url.pathname.startsWith("/api/sos") ||
    url.pathname.includes("mapbox.com");

  if (!shouldCache || event.request.method !== "GET") return;

  event.respondWith(
    caches.open(DATA_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) {
        fetch(event.request)
          .then((fresh) => {
            if (fresh.ok) cache.put(event.request, fresh.clone());
          })
          .catch(() => undefined);
        return cached;
      }

      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
  );
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

async function drainSOSQueue() {
  const db = await openSOSDB();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(SOS_QUEUE_STORE, "readonly");
    const store = tx.objectStore(SOS_QUEUE_STORE);
    const req = store.getAll();
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
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // keep queued for next sync
    }
  }
  db.close();
}

self.addEventListener("sync", (event) => {
  if (event.tag === "sos-sync") {
    event.waitUntil(drainSOSQueue());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "emergency-refresh-6h") {
    event.waitUntil(
      Promise.all([
        fetch("/api/emergency/alerts").catch(() => undefined),
        fetch("/api/sos").catch(() => undefined)
      ])
    );
  }
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() ?? { title: "Emergency Alert", body: "New safety update available." };
  event.waitUntil(
    self.registration.showNotification(payload.title || "Emergency Alert", {
      body: payload.body || "Please check Kashmir Connect emergency center.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: payload
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/emergency";
  event.waitUntil(clients.openWindow(url));
});
