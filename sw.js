// 電波の弱い現場でも開けるように、読み込んだ物をこの端末に残す。写真・記録は扱わない。
// VERSION は tools/build_site.py が、公開する中身から作る。
const VERSION = 'd6bdfc213481';
const CACHE = 'fpg2026-' + VERSION;
const SHELL = ['./', 'index.html', 'app/style.css', 'app/app.js', 'app/viewer.js', 'app/content.js', 'app/generated.js', 'app/icon.svg', 'models/bridge_retest.glb'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('fpg2026-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const heavy = url.pathname.endsWith('.glb') || url.hostname === 'cdn.jsdelivr.net';
  if (heavy) {
    // 3D と three.js：残してある物を先に使う
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // 画面と手順：新しい物を先に取り、取れなければ残してある物
  e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});
