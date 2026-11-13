// Offline service worker - cache-first for all app assets
const CACHE = 'drawing-app-4b4cb76fa6';
const ASSETS = ["./","app.css","app.js","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.json","vendor/heavy/eng.traineddata.gz","vendor/heavy/smp-arch-plan.png","vendor/heavy/smp-elec-plan.png","vendor/heavy/smp-iso.png","vendor/heavy/smp-pid.png","vendor/heavy/smp-section.png","vendor/heavy/smp-sld.png","vendor/heavy/smp-struct-plan.png","vendor/heavy/smp-user-welding-map-iso-sht2.png","vendor/heavy/smp-user-welding-map-iso.png","vendor/heavy/tesseract-core-lstm.wasm.js","vendor/heavy/tesseract-core-simd-lstm.wasm.js","vendor/heavy/tesseract-worker.min.js","vendor/heavy/tha.traineddata.gz","vendor/heavy/web-ifc-api.min.js","vendor/heavy/web-ifc.wasm","vendor/pdf.worker.min.js"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith('drawing-app-')).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url); if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((resp) => { if (resp.ok) { const cp = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); } return resp; }).catch(() => (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
