// Service worker SIPELAPOR — cache sederhana agar aplikasi cepat dibuka & tahan sinyal lemah.
// Halaman (index.html, dapur.html) diambil dari JARINGAN dulu, cache hanya cadangan saat offline:
// dengan cara lama (cache dulu) pengguna tetap memakai versi lama setelah perbaikan diterbitkan.
const CACHE = 'sipelapor-v4';
const URLS = ['./', 'index.html', 'dapur.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(URLS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (/script\.google(usercontent)?\.com/.test(e.request.url)) return;   // jangan cache panggilan API
  const url = new URL(e.request.url);
  const halaman = e.request.mode === 'navigate' || /\.html$|\/$/.test(url.pathname);
  const simpan = r => { if (r && r.ok && url.origin === self.location.origin) { const cl = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); } return r; };
  if (halaman) {
    // Jaringan dulu → versi terbaru langsung dipakai; offline → salinan terakhir di cache
    e.respondWith(fetch(e.request).then(simpan).catch(() => caches.match(e.request).then(c => c || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => {
    const net = fetch(e.request).then(simpan).catch(() => cached);
    return cached || net;
  }));
});
