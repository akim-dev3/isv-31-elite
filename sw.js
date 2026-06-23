/* Service Worker — оффлайн-кэш для шпаргалки ПМ.08
   Стратегия: cache-first для всех собственных ресурсов и шрифтов CDN.
   При обновлении сайта меняем CACHE_VERSION — старый кэш будет вычищен. */

const CACHE_VERSION = "pm08-cheat-v3";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./data.js",
  "./manifest.json",
  "./icon.svg",
  "./vendor/html-docx.js",
  "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css",
  "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // addAll падает целиком при любой ошибке — кладём по одному, чтобы кеш создался даже без интернета на отдельных ресурсах
      return Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn("[SW] skip cache:", url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // кэшируем только успешные ответы и только http(s)
          if (res && res.status === 200 && (req.url.startsWith("http://") || req.url.startsWith("https://"))) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // оффлайн и нет в кэше — отдадим index.html как fallback для навигации
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
