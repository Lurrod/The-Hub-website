/*
 * The Hub — service worker.
 *
 * Strategy (the site is mostly dynamic, frequently-changing stats):
 *   - Navigations  → network-first, fall back to a cached offline page when the
 *     network is unavailable. Page responses are never cached, so an
 *     authenticated or stale page is never served while online.
 *   - Static assets (Next build output, images, icons, fonts) → cache-first;
 *     these are content-hashed / immutable, so serving from cache is safe and
 *     makes repeat visits instant and offline-tolerant.
 *   - Anything non-GET or cross-origin → passthrough (no caching).
 *
 * Bump CACHE_VERSION on any change to this file or the precache list; the old
 * cache is deleted on activate.
 */
const CACHE_VERSION = "the-hub-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // addAll fails atomically; tolerate a missing asset so install never breaks.
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/agents/") ||
    url.pathname.startsWith("/roles/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|webp|avif|svg|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin go to network

  // Navigations: network-first with an offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || new Response("Offline", { status: 503 })),
      ),
    );
    return;
  }

  // Static assets: cache-first, then populate the cache on first miss.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((resp) => {
            if (resp.ok && resp.type === "basic") {
              const copy = resp.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return resp;
          }),
      ),
    );
  }
});
