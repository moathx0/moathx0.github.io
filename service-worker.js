/* ════════════════════════════════════════
   SHIKAKU — Service Worker
   يحفظ الملفات محلياً ويشغّل اللعبة بدون إنترنت
   ════════════════════════════════════════ */

const CACHE_NAME = 'shikaku-v3';

// الملفات التي نحفظها عند أول تشغيل
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ─── التثبيت: نحفظ كل الملفات ───
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// ─── التفعيل: نمسح الكاش القديم ───
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── الطلبات: نرجع من الكاش أولاً ───
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
