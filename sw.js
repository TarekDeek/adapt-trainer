/* Bump VERSION on every deploy that changes a cached file.
   Even if you forget, stale-while-revalidate below means a new build still
   lands on the next launch — the version bump just makes it immediate. */
const VERSION = "v2";
const CACHE = `adapt-${VERSION}`;
const ASSETS = ["./", "./index.html", "./bundle.js", "./manifest.webmanifest", "./icon-180.png"];

self.addEventListener("install", (e) => {
  /* cache:"reload" bypasses the browser HTTP cache — without it the install
     can precache the very build we are trying to replace. */
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" }))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Stale-while-revalidate: serve from cache instantly (works offline, which is
   the whole point), then refresh the cache in the background so the next
   launch has the new build. Plain cache-first never updated at all. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      /* Same reason: revalidate against the server, not the HTTP cache. */
      const network = fetch(new Request(req.url, { cache: "reload", credentials: "same-origin" }))
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) {
        e.waitUntil(network); // keep the SW alive while it refreshes
        return cached;
      }
      return (await network) || (await cache.match("./index.html"));
    })
  );
});
