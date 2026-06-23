const CACHE_VERSION = "v1";

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(CACHE_VERSION);
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise, event }) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    event.waitUntil(preloadResponsePromise.catch(() => undefined));
    return responseFromCache;
  }

  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    event.waitUntil(putInCache(request, preloadResponse.clone()));
    return preloadResponse;
  }

  try {
    const responseFromNetwork = await fetch(request);
    event.waitUntil(putInCache(request, responseFromNetwork.clone()));
    return responseFromNetwork;
  } catch (error) {
    return new Response("Network error", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/",
      "/index.html",
      "/main.css",
      "/resets.css",
      "/theme.css",
      "/favicon.ico",
    ]),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await enableNavigationPreload();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (/^https?:$/i.test(new URL(event.request.url).protocol))
    event.respondWith(
      cacheFirst({
        request: event.request,
        preloadResponsePromise: event.preloadResponse,
        event,
      }),
    );
});
