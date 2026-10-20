// Retired October 20, 2026. This worker never opens storage or calls a backend.
// Retain this exact update endpoint for previously installed obsolete PWAs.
const retiredScope = self.location.origin + "/portfolio-wrapper/lists/";
const notice = "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Lists retired</title><body><h1>This Lists app is retired</h1><p>The current Lists app is hosted on the NUC.</p><p><a href=\"https://spero.pfeiffee.com:8124/lists/\">Open current Lists</a></p><p>Stored data on this old origin has not been cleared. Keep any unsynchronized data for recovery; opening the current app does not transfer it.</p></body></html>";
self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  if (self.registration.scope !== retiredScope) return;
  await self.clients.claim();
  const windows = await self.clients.matchAll({ type: "window" });
  await Promise.allSettled(windows.filter(client => client.url.startsWith(retiredScope))
    .map(client => client.navigate(client.url)));
})()));
self.addEventListener("fetch", event => {
  if (self.registration.scope === retiredScope && event.request.mode === "navigate" &&
      event.request.url.startsWith(retiredScope)) {
    event.respondWith(Promise.resolve(new Response(notice, { status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })));
  }
});
