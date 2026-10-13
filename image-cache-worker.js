const AUCTION_IMAGE_CACHE = "usso-auction-images-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.destination !== "image") return;

  const url = new URL(event.request.url);
  const isAuctionImage = url.hostname === "ahhlfvjicxylidpmeciw.supabase.co"
    && url.pathname.includes("/storage/v1/object/public/listings/");
  if (!isAuctionImage) return;

  event.respondWith((async () => {
    const cache = await caches.open(AUCTION_IMAGE_CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    const response = await fetch(event.request);
    if (response.ok || response.type === "opaque") {
      try {
        await cache.put(event.request, response.clone());
      } catch (error) {}
    }
    return response;
  })());
});
