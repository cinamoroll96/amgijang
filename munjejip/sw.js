// 기계 임용 문제집 – 오프라인용 서비스 워커
// 파일이 바뀌면 VERSION이 바뀌고, 다음 실행 때 새 판으로 교체된다.
const VERSION = "0201d167f3";
const CACHE = "munjejip-" + VERSION;
const FILES = ["./", "index.html", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png", "pdfjs/pdf.min.mjs", "pdfjs/pdf.worker.min.mjs"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      // 같은 주소(github.io)를 쓰는 암기장 캐시는 건드리지 않고, 문제집의 옛 판만 지운다
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("munjejip-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // PDF는 페이지가 따로 기기에 저장한다(mjpdf-v1) — 여기서는 손대지 않음
  if (new URL(req.url).pathname.endsWith(".pdf")) return;
  const key = req.mode === "navigate" ? new URL("index.html", self.registration.scope).href : req;
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(key, { ignoreSearch: req.mode === "navigate" }).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res && res.ok && res.type === "basic") c.put(key, res.clone());
          return res;
        })
      )
    )
  );
});
