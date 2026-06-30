/* Service Worker — оффлайн-кэш для шпаргалки ПМ.08
   Стратегия: cache-first для всех собственных ресурсов и шрифтов CDN.
   При обновлении сайта меняем CACHE_VERSION — старый кэш будет вычищен. */

const CACHE_VERSION = "pm08-cheat-v13";

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
    "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:wght@400;700;800;900&family=Russo+One&family=Caveat:wght@400;700&family=Marck+Script&family=Bebas+Neue&family=Cormorant+Garamond:wght@400;600;700&family=Press+Start+2P&display=swap",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            // addAll падает целиком при любой ошибке — кладём по одному, чтобы кеш создался даже без интернета на отдельных ресурсах
            return Promise.all(
                CORE_ASSETS.map((url) =>
                    cache
                        .add(url)
                        .catch((err) =>
                            console.warn("[SW] skip cache:", url, err),
                        ),
                ),
            );
        }),
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== CACHE_VERSION)
                        .map((k) => caches.delete(k)),
                ),
            ),
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;

    const url = new URL(req.url);
    const isSameOrigin = url.origin === self.location.origin;

    // 1) Навигация (index.html) — Network-First.
    //    Свежая версия HTML всегда подтянется при наличии интернета,
    //    а оффлайн — отдадим кэш.
    if (req.mode === "navigate") {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches
                        .open(CACHE_VERSION)
                        .then((cache) => cache.put(req, copy));
                    return res;
                })
                .catch(() =>
                    caches
                        .match(req)
                        .then((c) => c || caches.match("./index.html")),
                ),
        );
        return;
    }

    // 2) Наши JS/CSS/JSON (app.js, data.js, manifest.json, vendor/*) —
    //    Stale-While-Revalidate: моментально отдаём из кэша, а в фоне
    //    скачиваем свежую версию для следующего открытия.
    if (isSameOrigin && /\.(js|css|json|svg)$/i.test(url.pathname)) {
        event.respondWith(
            caches.match(req).then((cached) => {
                const network = fetch(req)
                    .then((res) => {
                        if (res && res.status === 200) {
                            const copy = res.clone();
                            caches
                                .open(CACHE_VERSION)
                                .then((cache) => cache.put(req, copy));
                        }
                        return res;
                    })
                    .catch(() => cached);
                return cached || network;
            }),
        );
        return;
    }

    // 3) Всё остальное (шрифты CDN, картинки) — Cache-First.
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req)
                .then((res) => {
                    if (
                        res &&
                        res.status === 200 &&
                        (url.protocol === "http:" || url.protocol === "https:")
                    ) {
                        const copy = res.clone();
                        caches
                            .open(CACHE_VERSION)
                            .then((cache) => cache.put(req, copy));
                    }
                    return res;
                })
                .catch(() => undefined);
        }),
    );
});
