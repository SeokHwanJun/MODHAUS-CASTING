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
      data: { url: (payload.fcmOptions && payload.fcmOptions.link) || './' }
    });
  });
}

/* 알림을 누르면 앱을 엽니다 (이미 열려 있으면 그 창으로) */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.location.origin) === 0 && 'focus' in list[i]) {
        if ('navigate' in list[i]) { try { list[i].navigate(url); } catch (err) {} }
        return list[i].focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
