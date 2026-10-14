/* Service worker ng Ariel & Kate wedding website.
   - Network-first para sa mga page (laging pinakabagong bersyon kapag may internet; gumagana pa rin offline)
   - Stale-while-revalidate para sa mga larawan (mabilis at tipid sa data)
   - HINDI hinahawakan: Apps Script (data/RSVP/reactions), audio, video, at ibang website.
   Kapag nagpalit ka ng index.html at hindi lumabas agad, palitan ang VERSION sa ibaba (hal. "ak-v2"). */
const VERSION = "ak-v1";
const SHELL = ["./", "./index.html", "./invite.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];
const IMG_CACHE = VERSION + "-img";
const IMG_LIMIT = 150;

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) { return Promise.allSettled(SHELL.map(function (u) { return c.add(u); })); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf(VERSION) !== 0; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function trim(cacheName, max) {
  return caches.open(cacheName).then(function (c) {
    return c.keys().then(function (keys) { if (keys.length > max) return c.delete(keys[0]).then(function () { return trim(cacheName, max); }); });
  });
}

self.addEventListener("fetch", function (e) {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                  // Apps Script, Google Fonts, YouTube: sa browser
  if (req.headers.has("range")) return;                              // audio/video streaming
  if (/\.(mp3|mp4|webm|mov|m4v|ogg|wav)$/i.test(url.pathname)) return;

  // mga larawan: stale-while-revalidate
  if (req.destination === "image" || /\.(jpe?g|png|webp|gif|svg|ico)$/i.test(url.pathname)) {
    e.respondWith(
      caches.open(IMG_CACHE).then(function (cache) {
        return cache.match(req).then(function (hit) {
          const net = fetch(req).then(function (res) {
            if (res && res.ok) { cache.put(req, res.clone()).then(function () { trim(IMG_CACHE, IMG_LIMIT); }); }
            return res;
          }).catch(function () { return hit; });
          return hit || net;
        });
      })
    );
    return;
  }

  // mga page at code: network-first, may offline fallback
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined);
      });
    })
  );
});
