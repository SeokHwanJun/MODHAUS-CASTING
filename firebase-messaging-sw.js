/* 알림을 받아주는 작은 일꾼입니다. 앱이 꺼져 있어도 이 파일이 알림을 띄웁니다.
   설정값은 앱에서 주소로 넘겨주므로, 이 파일은 손댈 필요가 없습니다. */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

var q = new URL(self.location).searchParams;
var cfg = {
  apiKey: q.get('k') || '',
  projectId: q.get('p') || '',
  messagingSenderId: q.get('s') || '',
  appId: q.get('a') || '',
  authDomain: (q.get('p') || '') + '.firebaseapp.com'
};

if (cfg.apiKey && cfg.projectId) {
  firebase.initializeApp(cfg);
  var messaging = firebase.messaging();
  /* 서버는 data 만 보냅니다. 알림을 띄우는 건 오직 여기 한 곳뿐입니다.
     (notification 을 같이 보내면 파이어베이스가 자기도 띄워서 두 개가 됩니다) */
  messaging.onBackgroundMessage(function (payload) {
    var d = (payload && payload.data) || {};
    var n = (payload && payload.notification) || {};   /* 옛 방식으로 온 알림도 처리 */
    self.registration.showNotification(d.title || n.title || '신개팀 캐스팅', {
      body: d.body || n.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      /* 이름표를 매번 다르게 — 같으면 아이폰이 소리 없이 바꿔치기만 합니다 */
      tag: d.tag || ('cast-' + (d.id || 'x') + '-' + Date.now()),
      renotify: true,
      data: {
        id: d.id || '',
        url: d.url || (payload.fcmOptions && payload.fcmOptions.link) || './'
      }
    });
  });
}

/* 알림을 누르면 그 카드로 갑니다.
   앱이 이미 켜져 있으면 새로 고치지 않고 "이 카드 열어" 라고 말만 건넵니다 (빠르고, 아이폰에서도 됨).
   꺼져 있으면 ?id= 주소로 새로 엽니다. */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var d = e.notification.data || {};
  var url = d.url || './';
  var id = d.id || (function () { try { return new URL(url, self.location).searchParams.get('id') || ''; } catch (err) { return ''; } })();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.location.origin) !== 0) continue;
      try { c.postMessage({ type: 'open', id: id }); } catch (err) {}
      if ('focus' in c) return c.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
