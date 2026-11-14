// Offline service worker — precaches EVERY app asset on install (OCR engine, Thai/English data, IFC engine, PDF worker, viewer, samples)
// so all features work offline even if they were never used online. Paths are relative to this file (works under /Drawing-app/).
const VER = 'c0ab572104';
const CACHE = 'drawing-app-' + VER;
const ASSETS = ["./","app.css","app.js","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","index.html","manifest.json","vendor/heavy/eng.traineddata.gz","vendor/heavy/smp-arch-plan.png","vendor/heavy/smp-elec-plan.png","vendor/heavy/smp-iso.png","vendor/heavy/smp-pid.png","vendor/heavy/smp-section.png","vendor/heavy/smp-sld.png","vendor/heavy/smp-struct-plan.png","vendor/heavy/smp-user-welding-map-iso-sht2.png","vendor/heavy/smp-user-welding-map-iso.png","vendor/heavy/tesseract-core-lstm.wasm.js","vendor/heavy/tesseract-core-simd-lstm.wasm.js","vendor/heavy/tesseract-worker.min.js","vendor/heavy/tha.traineddata.gz","vendor/heavy/web-ifc-api.min.js","vendor/heavy/web-ifc.wasm","vendor/pdf.worker.min.js","vendor/viewer.min.js"];
const abs = (a) => new URL(a, self.location.href).href;
let done = 0, busy = false, lastErr = '';
const tell = async (msg) => { for (const c of await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })) c.postMessage(msg); };
async function precache() {
  busy = true; lastErr = '';
  const c = await caches.open(CACHE);
  const have = new Set((await c.keys()).map((r) => r.url));
  done = 0; const list = ASSETS.map(abs); let i = 0;
  const one = async (u) => {
    if (have.has(u)) { done++; return; }
    for (let t = 0; ; t++) {
      try {
        const r = await fetch(new Request(u, { cache: 'reload', credentials: 'same-origin' }));
        if (!r.ok) throw new Error(u + ' HTTP ' + r.status);
        // re-wrap: plain 200 without "redirected" flag (Safari refuses redirected responses for navigations), full body (no Range)
        const body = await r.arrayBuffer();
        await c.put(u, new Response(body, { status: 200, headers: { 'Content-Type': r.headers.get('Content-Type') || '', 'Content-Length': String(body.byteLength) } }));
        done++; tell({ type: 'sw-progress', ver: VER, done, total: list.length }); return;
      } catch (e) { if (t >= 2) { lastErr = String(e && e.message || e); throw e; } await new Promise((res) => setTimeout(res, 800 * (t + 1))); }
    }
  };
  const worker = async () => { while (i < list.length) await one(list[i++]); };
  try { await Promise.all([worker(), worker(), worker(), worker()]); } finally { busy = false; }
  tell({ type: 'sw-progress', ver: VER, done, total: list.length });
}
self.addEventListener('install', (e) => { e.waitUntil(precache().then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith('drawing-app-')).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
async function status() {
  if (busy) return { ver: VER, done, total: ASSETS.length, busy: true, err: lastErr };
  const c = await caches.open(CACHE); const have = new Set((await c.keys()).map((r) => r.url));
  const n = ASSETS.map(abs).filter((u) => have.has(u)).length; let bytes = 0;
  return { ver: VER, done: n, total: ASSETS.length, busy: false, err: lastErr, bytes };
}
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'status') e.waitUntil(status().then((s) => { const p = e.ports && e.ports[0]; if (p) p.postMessage(s); else if (e.source) e.source.postMessage({ type: 'sw-status', ...s }); }));
  if (d.type === 'recache') e.waitUntil(precache().catch(() => {}));
});
async function rangeResponse(req, resp) { // serve Range requests from the full cached body (Safari media/wasm quirks)
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || ''); if (!m) return resp;
  const buf = await resp.arrayBuffer(); const size = buf.byteLength; const start = m[1] ? +m[1] : Math.max(0, size - +m[2]); const end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': resp.headers.get('Content-Type') || '', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) } });
}
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') { // app shell: cache first, so the Home-Screen app opens instantly with no internet
    const root = abs('./'); const atRoot = url.href.split(/[?#]/)[0] === root || url.href.split(/[?#]/)[0] === abs('index.html');
    e.respondWith(caches.match(abs('index.html'), { cacheName: CACHE }).then((r) => r || caches.match(root, { cacheName: CACHE })).then(async (r) => {
      if (!r) return fetch(req);
      if (atRoot) return r;
      // deep link (e.g. /Drawing-app/some/page): serve the app with <base> so its relative files still resolve to the cached ones
      const html = (await r.text()).replace(/<head>/i, '<head><base href="' + root + '">');
      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }).catch(() => caches.match(abs('index.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(async (r) => {
    if (r) return req.headers.get('range') ? rangeResponse(req, r) : r;
    try { const resp = await fetch(req); if (resp.ok && resp.status === 200) { const cp = resp.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return resp; }
    catch { return Response.error(); }
  }));
});
