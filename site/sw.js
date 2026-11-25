// Reibun service worker: network-first with an offline cache (from Kanji Nexus).
//
// * Online: every same-origin GET goes to the network (so deploys are picked up
//   immediately) and the response refreshes the cache.
// * Offline / network failing: the cached copy is served.
// * Install: the whole app is precached so every page works offline after one visit.
//
// CI replaces VERSION and PRECACHE at deploy time (see .github/workflows/static.yml).
// Locally they stay as below and pages are cached as they are visited.
// * The tokenizer dictionary (kuromoji/dict/*.dat.gz, ~18 MB) never changes for a
//   given kuromoji release, so it is cache-first in its own cache that survives
//   deploys. Bump DICT_CACHE when the pinned kuromoji version changes.
// Cross-origin requests are never touched.

const VERSION = 'dev';
const PRECACHE = [];
const CACHE = `reibun-${VERSION}`;
const DICT_CACHE = 'reibun-kuromoji-0.1.2';
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('reibun-') && k !== CACHE && k !== DICT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const isPage = request.mode === 'navigate';
  // Pages are cached without their query (?focus=…) so one entry serves every deep link.
  const key = isPage ? new URL(request.url).origin + new URL(request.url).pathname : request;
  // Offline page fallback: the exact page, else Breakdown (cached as index.html or as "/").
  const fromCache = async () =>
    (await cache.match(key)) ||
    (isPage ? (await cache.match(new URL('./index.html', self.location).href)) || (await cache.match(new URL('./', self.location).href)) : undefined);

  // Pages always revalidate with the server (bypassing the browser's HTTP cache), so a
  // new deploy's HTML, which points at new ?v= asset URLs, is picked up immediately.
  // (A navigate-mode Request can't take init options, hence fetching by URL.)
  const network = (isPage ? fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(request)).then((response) => {
    if (response.ok) cache.put(key, response.clone());
    return response;
  });
  try {
    // Slow network: fall back to the cache after a few seconds if we have a copy,
    // otherwise keep waiting for the network.
    const winner = await Promise.race([network, new Promise((r) => setTimeout(r, NETWORK_TIMEOUT_MS, 'timeout'))]);
    if (winner !== 'timeout') return winner;
    return (await fromCache()) || (await network);
  } catch (err) {
    const cached = await fromCache();
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(DICT_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('/kuromoji/dict/')) event.respondWith(cacheFirst(request));
  else event.respondWith(networkFirst(request));
});
