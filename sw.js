/* v55-push1 · 화면 캐시 + FCM을 하나의 등록/범위에서 처리합니다.
 * 앱 폴더 안에서만 작동합니다. 다른 앱 캐시, 개인 데이터, 로그인 정보는 건드리지 않습니다.
 */
if (!self.CASTING_SHELL_LOADED) {
  self.CASTING_SHELL_LOADED = true;
  (function() {
    var BUILD = 'v55-push1', VERSION = 'casting-' + BUILD;
    var BASE = new URL('./', self.location.href);
    var PAGE = new URL('index.html', BASE).href;
    var SHELL = ['index.html','manifest.json','icon-192.png','icon-512.png','icon-180.png'];
    if (!self.CASTING_PUSH_LOADED) importScripts('./firebase-messaging-sw.js');

    self.addEventListener('install', function(event) {
      // 아이콘 한 장이 없어도 워커 설치/푸시 등록까지 실패시키지 않습니다.
      event.waitUntil(caches.open(VERSION).then(function(cache) {
        return Promise.all(SHELL.map(function(path) {
          var url = new URL(path,BASE).href;
          return fetch(url,{cache:'reload'}).then(function(res) {
            if (res.ok && res.type !== 'opaque') return cache.put(url,res);
          }).catch(function() {});
        }));
      }).catch(function() {}).then(function() { return self.skipWaiting(); }));
    });
    self.addEventListener('activate', function(event) {
      event.waitUntil(caches.keys().then(function(keys) {
        return Promise.all(keys.filter(function(k) { return k.indexOf('casting-v')===0 && k!==VERSION; })
          .map(function(k) { return caches.delete(k); }));
      }).then(function() { return self.clients.claim(); }));
    });
    self.addEventListener('message', function(event) {
      if (event.data && event.data.type==='CASTING_PUSH_HEALTH' && event.ports[0]) {
        event.ports[0].postMessage({build:BUILD,pushReady:!!self.CASTING_PUSH_OK,
          error:self.CASTING_PUSH_ERROR || '',scriptURL:self.location.href,scope:self.registration.scope});
      }
    });
    self.addEventListener('fetch', function(event) {
      var request=event.request, url=new URL(request.url);
      if (request.method!=='GET' || url.origin!==BASE.origin || url.pathname.indexOf(BASE.pathname)!==0) return;
      // 워커/JS를 예전 화면 캐시에서 제공하지 않습니다. Apps Script 요청도 캐시하지 않습니다.
      var page=request.mode==='navigate' || url.pathname===BASE.pathname || url.pathname===new URL(PAGE).pathname;
      var asset=SHELL.slice(1).some(function(name) { return url.pathname===new URL(name,BASE).pathname; });
      if (!page && !asset) return;
      if (page) {
        var network=fetch(request,{cache:'no-store'});
        var update=network.then(function(res) {
          if (res.ok) return caches.open(VERSION).then(function(c) { return c.put(PAGE,res.clone()); });
        }).catch(function() {});
        event.waitUntil(update);
        event.respondWith(new Promise(function(resolve) {
          var done=false, timer=setTimeout(fallback,3000);
          function finish(value) { if (!done) { done=true; clearTimeout(timer); resolve(value); } }
          function fallback() {
            caches.match(PAGE,{cacheName:VERSION}).then(function(hit) {
              if (hit) finish(hit);
              else network.then(finish,function() { finish(Response.error()); });
            }).catch(function() { network.then(finish,function() { finish(Response.error()); }); });
          }
          network.then(function(res) { if (res.ok) finish(res); else fallback(); },fallback);
        }));
      } else {
        event.respondWith(caches.open(VERSION).then(function(c) {
          return c.match(url.href,{ignoreSearch:true}).then(function(hit) {
            if (hit) return hit;
            return fetch(request).then(function(res) {
              if (res.ok) { var copy=res.clone(); c.put(url.href,copy).catch(function() {}); }
              return res;
            });
          });
        }));
      }
    });
    // 백그라운드 알림/클릭은 Firebase SDK가 담당합니다. showNotification 중복 호출 금지.
  })();
}
