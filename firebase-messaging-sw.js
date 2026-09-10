/* v55-push1 · sw.js에서 불러오는 푸시 모듈.
 * 이 파일을 별도 register()하지 않습니다. 구버전 앱의 직접 등록도 하단에서 호환합니다.
 * 아래 값은 웹 앱 공개 설정입니다. 서비스 계정 비밀 키를 넣지 마세요.
 */
if (!self.CASTING_PUSH_LOADED) {
  self.CASTING_PUSH_LOADED = true;
  self.CASTING_PUSH_OK = false;
  self.CASTING_PUSH_ERROR = '';
  try {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    if (!firebase.apps.length) firebase.initializeApp({
      apiKey: 'AIzaSyBoo4WBmmLCR4act4PVaJVVp0jYLBl3bsc',
      projectId: 'modhauscasting-6ffd7',
      messagingSenderId: '415782452395',
      appId: '1:415782452395:web:280a54e772fae715eecbee',
      authDomain: 'modhauscasting-6ffd7.firebaseapp.com'
    });
    firebase.messaging();
    self.CASTING_PUSH_OK = true;
  } catch (err) {
    // 화면 캐시는 계속 동작하고, 페이지의 진단 버튼으로 이 오류를 확인합니다.
    self.CASTING_PUSH_ERROR = String(err && err.message || err).slice(0,240);
  }
}
// 오래된 index.html이 이 파일을 워커로 등록해도 화면 캐시와 푸시를 모두 유지합니다.
if (!self.CASTING_SHELL_LOADED) importScripts('./sw.js');
