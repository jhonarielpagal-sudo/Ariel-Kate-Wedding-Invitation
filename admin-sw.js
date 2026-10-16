/* Service worker ng ADMIN lang. Hiwalay sa sw.js ng main site (mas makitid na scope = ito ang mananalo sa admin.html).
   Walang cache: lahat ay diretso sa network. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) { e.respondWith(fetch(e.request)); });
