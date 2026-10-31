// Gov-Assist 서비스 워커 — 휴대폰 '홈 화면에 추가'(앱 설치)와 오프라인 열기용 (2026-10-28)
// 화면(index.html)·뉴스·중계 주소는 '인터넷 먼저, 안 되면 마지막 저장본'. 아이콘·매니페스트는 저장본 먼저.
// 양식(forms/)·편집기(rhwp/)·외부 주소(API·글꼴·CDN)는 건드리지 않는다 — 용량이 크고 매번 새로 받아야 하는 것들.
// V 는 publish-web 이 커밋 번호로 바꾼다 → 새 화면을 올리면 옛 저장본은 지워진다.
const V = 'ga-f2ca041e';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;            // 외부(API·CDN·글꼴)는 그대로
  const path = url.pathname.slice(self.registration.scope.replace(self.location.origin, '').length);
  if (/^(forms|rhwp)\//.test(path)) return;                                            // 양식·편집기는 그대로
  const networkFirst = req.mode === 'navigate' || /^(index\.html)?$/.test(path) || /\.json$/.test(path);
  if (networkFirst) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(req.mode === 'navigate' ? 'index.html' : req, copy)); } return res; })
      .catch(() => caches.match(req.mode === 'navigate' ? 'index.html' : req).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok && /^icons\/|manifest/.test(path)) { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); } return res; })));
});
