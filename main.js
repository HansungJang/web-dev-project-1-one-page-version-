  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
  import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
  } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";  
  import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

  // 1. Firebase 설정 (제공해주신 정보 유지)
  const firebaseConfig = {
    apiKey: "AIzaSyBHAG_rdo3NxBWEJIGSnt34dYsXeP5G2lg",
    authDomain: "web1-onepage-ver.firebaseapp.com",
    projectId: "web1-onepage-ver",
    storageBucket: "web1-onepage-ver.firebasestorage.app",
    messagingSenderId: "790854514107",
    appId: "1:790854514107:web:a14055b31f90844da8009e"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    // 로컬 캐시 사용 설정
    localCache: persistentLocalCache({
      // 여러 브라우저 탭에서 동시에 접속해도 캐시가 동기화되도록 관리
      tabManager: persistentMultipleTabManager()
    })
  });
  const CONTENT_REF = doc(db, 'site', 'content');
  const TEXT_IDS = ['e-hero-h', 'e-hero-b', 'e-fields-h', 'e-info-h', 'e-cred-h', 'e-con-b', 'e-info-detail', 'copy-wright', 'e-c1', 'e-c2', 'e-c3', 'e-c4', 'e-c5', 'e-f1-h', 'e-f1-b', 'e-f2-h', 'e-f2-b', 'e-f3-h', 'e-f3-b', 'e-f4-h', 'e-f4-b', 'e-f5-h', 'e-f5-b', 'e-f6-h', 'e-f6-b', 'e-loc', 'e-email', 'e-email-link', 'e-map-link', 'tel', 'Fax', 'e-res', 'e-con-h'];

  // [중요] 초기 데이터 로드 함수
  async function loadData() {
    const CACHE_KEY = 'site_content_cache';
    const TIME_KEY = 'site_content_time';
    const cachedData = localStorage.getItem(CACHE_KEY);
    const lastFetchTime = localStorage.getItem(TIME_KEY);
    
    const now = new Date().getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24시간을 밀리초로 계산

    // 1. 먼저 로컬 캐시 데이터를 화면에 뿌림 (사용자에게 즉시 보여줌)
    if (cachedData) {
      applyDataToUI(JSON.parse(cachedData));
    }

    // 2. 조건부 DB 호출
    // 캐시가 없거나, 마지막으로 가져온 지 24시간이 지났을 때만 DB에 접속
    if (!cachedData || !lastFetchTime || (now - lastFetchTime > ONE_DAY)) {
      try {
        const snap = await getDoc(CONTENT_REF);
        if (snap.exists()) {
          const data = snap.data();
          
          // 데이터가 변경되었을 때만 UI 업데이트 및 캐시 갱신
          if (JSON.stringify(data) !== cachedData) {
            applyDataToUI(data);
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(TIME_KEY, now.toString()); // 업데이트 시간 기록
            console.log("DB에서 새로운 데이터를 로드하고 캐시를 갱신했습니다.");
          }
        }
      } catch (e) {
        console.error("DB 로드 실패:", e);
      }
    } else {
      console.log("24시간이 지나지 않아 로컬 캐시를 사용합니다. DB 호출 생략.");
    }
  }

// UI에 데이터를 입히는 로직 분리
 function applyDataToUI(data) {
  TEXT_IDS.forEach(id => {
    const el = document.getElementById(id);
    const item = data[id];
    if (!el || !item) return;

    if (id === 'e-email-link' || id === 'e-map-link') {
      // 주소만 변경 (텍스트 유지)
      if (item.href) el.setAttribute('href', item.href);
    } 
    else {
      // 기본적으로 텍스트 반영
      if (item.html) el.innerHTML = item.html;
      // tel의 경우 저장된 주소가 있다면 추가 반영
      if (id === 'tel' && item.href) {
        el.querySelector('a')?.setAttribute('href', item.href);
      }
    }
  });
}
  // [중요] 관리자 저장 함수 (전역 window 객체에 등록)
  window.saveAll = async function() {
    const snap = await getDoc(CONTENT_REF);   
    const existingData = snap.exists() ? snap.data() : {};
    const newData = {};

    TEXT_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      if (id === 'e-email-link' || id === 'e-map-link') {
        // 1. 이메일 버튼: 텍스트는 무시하고 href만 저장
        newData[id] = { href: el.getAttribute('href') };
      } 
      else if (id === 'tel') {
        // 2. 전화번호: 화면의 글자(innerHTML)와 href를 모두 저장
        newData[id] = { html: el.innerHTML, href: el.querySelector('a')?.getAttribute('href') };
      } 
      else {
        // 3. 기타: 텍스트 내용만 저장
        newData[id] = { html: el.innerHTML };
      }
    });

    const mergedData = { ...existingData, ...newData };

    try {
      await setDoc(CONTENT_REF,  mergedData);
      localStorage.removeItem('site_content_time'); // 캐시 강제 만료
      showToast('✓ 클라우드에 성공적으로 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('저장 권한이 없습니다.');
    }
  };

  // 관리자 로그아웃
// index.html 내 window.logout 수정
window.logout = () => {
  signOut(auth).then(() => {
    // 404를 방지하기 위해 파일명을 명시하거나 메인 경로(/)로 이동
    window.location.href = 'index.html'; 
  }).catch((e) => console.error("로그아웃 오류:", e));
};

// 실행 흐름 부분 수정
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  initScrollReveal();

  // 인증 상태 감시
  onAuthStateChanged(auth, (user) => {
    const mgrLink = document.getElementById('mgr-link'); // 링크 요소 가져오기
    const mapLink = document.getElementById('e-map-link'); // 지도 링크 요소
    const adminBar = document.getElementById('admin-bar'); // 관리자 바 요소
    if (user) {
      // 1. 관리자 모드 활성화 (기존 로직)
      document.body.classList.add('edit-mode');
      if(adminBar) adminBar.classList.add('on');
      TEXT_IDS.forEach(id => {
        const el = document.getElementById(id); 
        // test for update
        if(!el) return;

        if (id !== 'e-email-link') el.setAttribute('contenteditable', 'true');      
      });

      // 2. [추가] 로그인 상태일 때 Manager 버튼 클릭 제어
      // 지도 URL 수정 logic 
      if (mapLink) {
            mapLink.addEventListener('click', (e) => {
              e.preventDefault(); // 페이지 이동 방지
              
              const currentUrl = mapLink.getAttribute('href');
              // 브라우저 기본 prompt를 사용하여 새 URL 입력 받기
              const newUrl = prompt("새로운 지도 URL 주소를 입력하세요:", currentUrl);
              
              if (newUrl !== null && newUrl !== "") {
                mapLink.setAttribute('href', `${newUrl}`);
                showToast('지도 연결 주소가 변경되었습니다. 저장 버튼을 눌러주세요.');
              }
            });
          }

      if (mgrLink) {
        mgrLink.addEventListener('click', (e) => {
          e.preventDefault(); // 페이지 이동 막기
          showToast('이미 로그인된 상태입니다.'); // 토스트 알림
        });
      }
    } else {
      // 로그아웃 상태일 때는 기본 이동 허용 (필요 시 추가 로직 작성 가능)
      document.body.classList.remove('edit-mode');
      if (adminBar) { adminBar.classList.remove('on');}
    }

      // 3. 전화번호 (tel): 텍스트 수정 시 href 자동 갱신 로직 (선택 사항)
    const telBox = document.getElementById('tel');
    if (telBox) {
      telBox.oninput = () => {
        const pureNum = telBox.innerText.replace(/[^0-9+]/g, '');
        telBox.querySelector('a')?.setAttribute('href', `tel:${pureNum}`);
      };
    }

    // 4. 이메일 (e-email-link): 텍스트 수정 시 href 자동 갱신 로직 (선택 사항)
    const emailBox = document.getElementById('e-email-link');
    const newEmailBox = document.getElementById('e-email');
    if (emailBox && newEmailBox) {
      newEmailBox.oninput = () => {
        const pureEmail = newEmailBox.innerText.replace(/[^a-zA-Z0-9@.-]/g, '');
        emailBox.setAttribute('href', `mailto:${pureEmail}`);
      };
    }

});

    window.addEventListener('scroll', () => {
      document.getElementById('nav').classList.toggle('stuck', window.scrollY > 50);
    });
  });

  // 기타 UI 스크립트 (기존 유지)
  window.toggleMenu = function() {
    document.getElementById('nav-list').classList.toggle('open');
    document.querySelector('.burger').classList.toggle('active');
  }

  function showToast(m) {
    const t = document.getElementById('toast');
    t.textContent = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function initScrollReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.sr').forEach(el => io.observe(el));
  }

    window.doLogin = async function() {
      const emailEl = document.getElementById('m-id');
      const pwEl = document.getElementById('m-pw');
      const errEl = document.getElementById('m-err');
  
      if (!emailEl || !pwEl) return;
  
      const email = emailEl.value.trim();
      const pw = pwEl.value;
  
      try {
        await signInWithEmailAndPassword(auth, email, pw);
        showToast('✓ 로그인 되었습니다.', 'ok');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      } catch(e) {
        err.style.display = 'block';
        document.getElementById('m-pw').value = '';
        console.error("로그인 에러:", e);
      }
    };