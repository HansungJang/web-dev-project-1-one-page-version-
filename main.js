  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
  import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
  } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";  
  import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
  // [추가] experts.html 파일, 이미지 & 양력 업로드 
  // import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
  import { collection, onSnapshot, addDoc, deleteDoc, query, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
  const TEXT_IDS = ['h-program','e-hero-h', 'e-hero-b', 'e-fields-h', 'e-info-h', 'e-cred-h', 'e-con-b', 'e-info-detail', 'copy-wright', 'e-c1', 'e-c2', 'e-c3', 'e-c4', 'e-c5', 'e-f1-h', 'e-f1-b', 'e-f2-h', 'e-f2-b', 'e-f3-h', 'e-f3-b', 'e-f4-h', 'e-f4-b', 'e-f5-h', 'e-f5-b', 'e-f6-h', 'e-f6-b', 'e-loc', 'e-email', 'e-email-link', 'e-map-link', 'tel', 'Fax', 'e-res', 'e-con-h'];




  // experts.html 
  // const storage = getStorage(app);
  const expertsCol = collection(db, 'experts');
  const ASSET_BASE_PATH = 'assets/experts/';
  const DEFAULT_EXPERT_IMG = 'assets/logo.png'; // 이미지 미설정 시 기본값

  // // [중요] 초기 데이터 로드 함수
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
// main.js

async function applyDataToUI(data) {
  if (!data) return;
  // Existing field mapping...
  for (const key in data) {
    const el = document.getElementById(key);
    if (el) {
      if (el.tagName === 'IMG') el.src = data[key];
      else el.innerText = data[key];
    }
  }

  // Ensure the expert listener is active when data is applied
  initExpertListener();
}
  // [중요] 관리자 저장 함수 (전역 window 객체에 등록)
// main.js

window.saveAll = async () => {
  const adminBar = document.getElementById('admin-bar');
  if (!adminBar || !adminBar.classList.contains('on')) return;

  try {
    const newData = {};
    // Collect all editable fields except those inside the expert grid
    document.querySelectorAll('[id^="e-"], [id^="img-"]').forEach(el => {
      if (el.closest('#expert-dynamic-grid')) return; // Skip experts (they auto-save)
      
      if (el.tagName === 'IMG') newData[el.id] = el.src;
      else newData[el.id] = el.innerText;
    });

    await setDoc(doc(db, 'site', 'content'), newData);
    showToast("사이트 설정이 저장되었습니다. (전문가 정보는 실시간 저장됨)");
  } catch (e) {
    console.error("Save Error:", e);
    showToast("저장 중 오류가 발생했습니다.", "err");
  }
};

  // 관리자 로그아웃
// index.html 내 window.logout 수정
// main.js

window.logout = async () => {
  if (confirm("로그아웃 하시겠습니까?")) {
    try {
      await signOut(auth); 
      showToast("로그아웃 되었습니다.");
      // The onAuthStateChanged listener will handle the rest of the UI
    } catch (e) {
      console.error("Logout Error:", e);
    }
  }
};

// 실행 흐름 부분 수정
window.addEventListener('DOMContentLoaded', () => {
  // loadData(); (for test)
  initScrollReveal();

  // 인증 상태 감시
onAuthStateChanged(auth, (user) => {
  const adminElements = document.querySelectorAll('.admin-only');
  const mgrLink = document.getElementById('mgr-link'); // 링크 요소 가져오기
  const adminBar = document.getElementById('admin-bar'); // 관리자 바 요소

  if (user) {
    console.log("Admin logged in:", user.email);
    if(adminBar) adminBar.classList.add('on');
    document.body.classList.add('edit-mode');
    adminElements.forEach(el => el.style.display = 'flex');
    show_statechange_home(); 
    show_statechange_apply(); 
    show_statechange_center();
    show_statechange_procedure(); 
    show_statechange_experts();
    show_statechange_location();
    show_statechange_specialties();

    if (mgrLink) {
        mgrLink.addEventListener('click', (e) => {
          e.preventDefault(); // 페이지 이동 막기
          showToast('이미 로그인된 상태입니다.'); // 토스트 알림
        });
      }
  
  } else {
    document.body.classList.remove('edit-mode');
    if(adminBar) adminBar.classList.remove('on');
    adminElements.forEach(el => el.style.display = 'none');
  }


    
  // Refresh the expert grid to enable/disable editing features
  renderExpertGrid(); 
});

  function state_isEditable(){
    const admin_state = document.getElementById('admin-bar');
    const adminBar = document.getElementById('admin-bar');
    if(adminBar && adminBar.classList.contains('on')) {
      return true;
    }
    else{
      return false;
    }
  }
  
  function show_statechange_home(){
     const card_list = ['sr-card-s1', 'sr-card-s2', 'sr-card-s3', 'sr-card-s4', 'sr-card-s5', 'sr-card-s6'];
     const editable = state_isEditable();
      card_list.forEach((card) => {
        let card_el = document.getElementById(card);
        if(card_el)card_el.setAttribute('contenteditable', editable.toString());
      });
  }

  function show_statechange_apply(){
     const apply_form = document.getElementById('contact');
     const editable = state_isEditable();
     if(apply_form)apply_form.setAttribute('contenteditable', editable.toString());   
  }

  function show_statechange_experts(){
      const expert_section = document.getElementById('experts-section');
      const editable = state_isEditable();
      if(expert_section)expert_section.setAttribute('contenteditable', editable.toString());
  }

  function show_statechange_location(){
    const location_section = document.getElementById('location');
    const editable = state_isEditable();
    if(location_section)location_section.setAttribute('contenteditable', editable.toString());
  }

  function show_statechange_specialties(){
    const specialties_section = document.getElementById('fields');
    const editable = state_isEditable();
    if(specialties_section)specialties_section.setAttribute('contenteditable', editable.toString());
  }

  function show_statechange_center(){
    const center_contents = ['center-contet', 'contents-reverse']; 
    const editable = state_isEditable();
      center_contents.forEach((content) => { 
        let content_el = document.getElementById(content);
        if(content_el)content_el.setAttribute('contenteditable', editable.toString());
      });
  }

  function show_statechange_procedure(){
      const procedure_contents = ['procedure-hero', 'procedure-section', 'procedure-section-alt'];
      const editable = state_isEditable();
      procedure_contents.forEach((content) => {
        let content_el = document.getElementById(content);
        if(content_el)content_el.setAttribute('contenteditable', editable.toString());
       });
  } 

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
        setTimeout(() => { window.location.href = '../index.html'; }, 1000);
      } catch(e) {
        err.style.display = 'block';
        document.getElementById('m-pw').value = '';
        console.error("로그인 에러:", e);
      }
    };

    // experts.html 
    // I've separated this so it can be called whenever auth state changes
    async function renderExpertGrid() {
      const q = query(expertsCol, orderBy("createdAt", "asc"));
      
      onSnapshot(q, (snapshot) => {
        const grid = document.getElementById('expert-dynamic-grid');
        if (!grid) return;
        
        const isEdit = document.body.classList.contains('edit-mode');
        
        grid.innerHTML = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const id = docSnap.id;
          
          return `
            <div class="expert-card">
              <div class="exp-img-wrapper" onclick="${isEdit ? `triggerAssetSelect('${id}')` : ''}">
                   <img src="${resolveExpertImg(data.img)}">
                ${isEdit ? '<div class="img-edit-overlay">변경</div>' : ''}
              </div>
              <div class="exp-info">
                <div class="exp-name" ${isEdit ? `contenteditable="true" onblur="updateExp('${id}', 'name', this.innerText)"` : ''}>
                  ${data.name}
                </div>
                <div class="exp-bio" ${isEdit ? `contenteditable="true" onblur="updateExp('${id}', 'bio', this.innerText)"` : ''}>
                  ${data.bio}
                </div>
                ${isEdit ? `<button onclick="deleteExp('${id}')" class="delete-btn">삭제</button>` : ''}
              </div>
              <input type="file" id="file-${id}" style="display:none" onchange="uploadPhoto('${id}', this)" accept="image/*">
            </div>
          `;
        }).join('');
      });
    }



 // 1. Storage Connection Check Function
// window.checkStorageConnection = async () => {
//   try {
//     console.log("Current Bucket:", firebaseConfig.storageBucket);
//     showToast("Storage 연결 확인 중... 콘솔을 확인하세요.");
//   } catch (e) {
//     console.error("Storage Error:", e);
//     alert("연결 오류: " + e.message);
//   }
// };

window.checkAssetsFolder = () => {
  const msg =
    `[Assets 폴더 안내]\n` +
    `이미지 파일 위치: assets/experts/\n` +
    `기본 이미지:      ${DEFAULT_EXPERT_IMG}\n\n` +
    `이미지 추가 방법:\n` +
    `  1. 이미지 파일을 assets/experts/ 폴더에 복사\n` +
    `  2. 관리자 모드에서 전문가 카드 이미지 클릭\n` +
    `  3. 파일명 입력 (예: kim.jpg)`;
  alert(msg);
  console.log(msg);
};

// 2. Real-time Expert Listener
function initExpertListener() {
  const q = query(expertsCol, orderBy("createdAt", "asc"));
  
  onSnapshot(q, (snapshot) => {
    const grid = document.getElementById('expert-dynamic-grid');
    if (!grid) return;
    
    const isEdit = document.body.classList.contains('edit-mode');
    
    grid.innerHTML = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      const imgSrc = resolveExpertImg(data.img);


      return `
        <div class="expert-card">
          <div class="exp-img-wrapper"
            ${isEdit ? `onclick="triggerAssetSelect('${id}')" style="cursor:pointer;"` : ''}>
            <img src="${imgSrc}" id="img-${id}" alt="${data.name || '전문가'}"
              onerror="this.src='${DEFAULT_EXPERT_IMG}'">
            ${isEdit ? '<div class="img-edit-overlay">파일명 변경</div>' : ''}
          </div>
          <div class="exp-info">
            <div class="exp-name"
              ${isEdit ? `contenteditable="true" onblur="updateExp('${id}', 'name', this.innerText)"` : ''}>
              ${data.name}
            </div>
            <div class="exp-bio"
              ${isEdit ? `contenteditable="true" onblur="updateExp('${id}', 'bio', this.innerText)"` : ''}>
              ${data.bio}
            </div>
            ${isEdit ? `
              <div class="exp-img-info" style="font-size:11px; color:#888; margin-top:4px;">
                이미지: ${data.img || '미설정'}
              </div>
              <button onclick="deleteExp('${id}')"
                style="color:red; font-size:11px; border:none; background:none; cursor:pointer; margin-top:10px;">
                [삭제]
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  });
}

// 3. CRUD Operations
window.addNewExpert = async () => {
  await addDoc(expertsCol, {
    name: "성함 입력",
    bio: "약력을 입력해주세요.",
    img: "",
    createdAt: new Date()
  });
};

window.updateExp = async (id, field, value) => {
  await updateDoc(doc(db, 'experts', id), { [field]: value });
};

window.deleteExp = async (id) => {
  if(confirm("이 전문가를 삭제하시겠습니까?")) {
    await deleteDoc(doc(db, 'experts', id));
  }
};

// 4. Image Upload Logic
// window.triggerUpload = (id) => document.getElementById(`file-${id}`).click();
window.triggerAssetSelect = async (id) => {
  const currentDoc = await getDoc(doc(db, 'experts', id));
  const currentImg = currentDoc.exists() ? (currentDoc.data().img || '') : '';
 
  const filename = prompt(
    `assets/experts/ 폴더에 있는 이미지 파일명을 입력하세요.\n` +
    `이미지 파일은 개발 관리자가 직접 관리하고 있습니다. jangfamily1973@gmail.com 으로 연락주세요.` +
    `예시: kim.jpg, park.png\n\n` +
    `현재값: ${currentImg || '미설정'}`,
    currentImg
  );
 
  if (filename === null) return; // 취소
  if (filename.trim() === '') {
    await updateDoc(doc(db, 'experts', id), { img: '' });
    showToast("이미지가 제거되었습니다.");
    return;
  }
 
  const cleanName = filename.trim().replace(/^assets\/experts\//, ''); // 경로 중복 방지
  await updateDoc(doc(db, 'experts', id), { img: cleanName });
  showToast(`이미지 경로 저장 완료: assets/experts/${cleanName}`);
};

// 4. Image Upload Logic
// window.uploadPhoto = async (id, input) => {
//   // [수정] 파일이 선택되지 않았을 경우 예외 처리
//   console.log("꾸러미 전체:", input.files);      // FileList {0: File, length: 1} -> 객체 형태
//   console.log("진짜 파일 하나:", input.files[0]); // File {name: "test.jpg", size: 1690000, ...} -> 실제 데이터

//   if (!input.files || input.files.length === 0) {
//     console.error("선택된 파일이 없습니다.");
//     return;
//   }

//   // [중요!] .files가 아니라 .files을 가져와야 실제 '파일 데이터'가 담깁니다.
//   const file = input.files[0]; 
  
//   // 파일 확장자 유지 (선택 사항이지만 권장)
//   const extension = file.name.split('.').pop();
//   const storageRef = ref(storage, `experts/${id}_${Date.now()}.${extension}`);
  
//   try {
//     showToast("이미지 업로드 중...");
    
//     // 업로드 실행 (metadata를 추가하여 octet-stream 방지)
//     const metadata = { contentType: file.type };
//     const result = await uploadBytes(storageRef, file, metadata);
    
//     // 다운로드 URL 생성
//     const url = await getDownloadURL(result.ref);
//     console.log("새 이미지 URL:", url);

//     // Firestore 업데이트
//     await updateDoc(doc(db, 'experts', id), { img: url });
    
//     showToast("업로드 완료!");
//   } catch (e) {
//     console.error("Upload Error:", e);
//     alert("업로드 실패: " + e.message);
//   }
// };

// 
function resolveExpertImg(imgValue) {
  if (!imgValue) return DEFAULT_EXPERT_IMG;
  if (imgValue.startsWith('http')) return imgValue; // 기존 Storage URL 호환
  return ASSET_BASE_PATH + imgValue;                // 예: "assets/experts/kim.jpg"
}


// Call the listener when the page loads
initExpertListener();