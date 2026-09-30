/* Coach OS service worker: keeps the pages he needs on the field readable with no signal.
   Reading only. Saving still needs a connection. Nothing here runs unless the app is installed or visited in a browser. */
const VERSION = "v1";
const PAGES = `coach-os-pages-${VERSION}`;
const STATIC = `coach-os-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("coach-os-") && k !== PAGES && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Pages that must always come from the network (or not at all).
const NEVER = [/^\/api\//, /^\/cal\//, /^\/settings\/export/, /^\/documents\/[^/]+\/file/, /^\/login/, /^\/share/];
const isStatic = (path) => /^\/(_next\/static|brand|icons)\//.test(path) || /\.(woff2?|png|jpg|svg|ico|webmanifest)$/.test(path);

// Only real, signed-in pages are kept: not redirects to the login page, not errors.
const cacheable = (res) => res.ok && !res.redirected && res.type === "basic" && (res.headers.get("content-type") || "").includes("text/html");

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER.some((re) => re.test(url.pathname))) return;

  if (isStatic(url.pathname)) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Page loads: network first, and the last good copy when the network is missing or slow.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(PAGES);
      try {
        const res = await withTimeout(fetch(req), 4000);
        if (cacheable(res)) cache.put(url.pathname + url.search, res.clone());
        return res;
      } catch {
        const hit = await cache.match(url.pathname + url.search);
        if (hit) return hit;
        return (await caches.open(STATIC).then((c) => c.match(OFFLINE_URL))) || Response.error();
      }
    })());
    return;
  }

  // In-app navigation asks for a data payload instead of a page. Offline, fail fast so the app falls back to a full page load, which the branch above answers from the saved copy.
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) {
    event.respondWith(fetch(req).catch(() => new Response("", { status: 503 })));
  }
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "cache-urls" && Array.isArray(data.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(PAGES);
      let saved = 0;
      for (const path of data.urls.slice(0, 40)) {
        if (typeof path !== "string" || !path.startsWith("/") || NEVER.some((re) => re.test(path))) continue;
        try {
          const res = await fetch(path, { credentials: "same-origin", headers: { Accept: "text/html" } });
          if (cacheable(res)) { await cache.put(path, res); saved++; }
        } catch { /* offline or a slow page: keep whatever copy is already saved */ }
      }
      const clients = await self.clients.matchAll();
      for (const c of clients) c.postMessage({ type: "cached", saved, at: Date.now() });
    })());
  }
  if (data.type === "clear") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("coach-os-pages-")).map((k) => caches.delete(k)))));
  }
});
