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
  messaging.onBackgroundMessage(function (payload) {
    var n = (payload && payload.notification) || {};
    self.registration.showNotification(n.title || '신개팀 캐스팅', {
      body: n.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'cast-' + ((payload.data && payload.data.id) || 'x'),
      renotify: true,
      data: {
        id: (payload.data && payload.data.id) || '',
        url: (payload.data && payload.data.url) || (payload.fcmOptions && payload.fcmOptions.link) || './'
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
