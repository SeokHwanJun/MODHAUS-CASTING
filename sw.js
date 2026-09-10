/* 캐스팅 보드 — 화면 파일 저장소.
   index.html 은 '네트워크 우선'(3초 안에 오면 최신, 안 오면 저장본) → 새 버전이 올라가면 다음 실행에 바로 적용.
   아이콘·매니페스트는 저장본 우선. 데이터(Apps Script)는 건드리지 않음. */
var VERSION = "casting-v48";
var SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function isShellPage(url) { return url.pathname.endsWith("/") || url.pathname.endsWith("/index.html"); }
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(function (c) {
    if (isShellPage(url) || e.request.mode === "navigate") {
      return new Promise(function (resolve) {
        var done = false;
        var t = setTimeout(function () { if (done) return; done = true; c.match("./index.html").then(function (hit) { resolve(hit || fetch(e.request)); }); }, 3000);
        fetch(e.request, { cache: "no-store" }).then(function (res) {
          if (res && res.ok) { c.put("./index.html", res.clone()); }
          if (done) return; done = true; clearTimeout(t); resolve(res);
        }).catch(function () {
          if (done) return; done = true; clearTimeout(t);
          c.match("./index.html").then(function (hit) { resolve(hit || Response.error()); });
        });
      });
    }
    return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) { if (res && res.ok) c.put(e.request, res.clone()); return res; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
