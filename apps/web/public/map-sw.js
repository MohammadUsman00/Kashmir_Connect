const CACHE_NAME = "kc-mapbox-tiles-v1";
const MAX_ITEMS = 180;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ITEMS) return;
  const diff = keys.length - MAX_ITEMS;
  for (let i = 0; i < diff; i += 1) {
    await cache.delete(keys[i]);
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isMapTile =
    url.hostname.includes("mapbox.com") &&
    (url.pathname.includes("/tiles/") || url.pathname.includes("/styles/") || url.pathname.includes("/v4/"));

  if (!isMapTile || event.request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response && response.ok) {
        cache.put(event.request, response.clone());
        await trimCache(cache);
      }
      return response;
    })
  );
});
