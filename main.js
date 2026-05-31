  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
  import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
  } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";  
  import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
  import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
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

  if (window.location.hostname === "localhost") {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  
  
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

// [TO DO]
// 1. 페이지별로 이미 DB에 저장된 항목 있는지 조사 
window.getHomeContent = async () => {
  try {
    const snap = await getDoc(doc(db, 'contents', 'index'));
    return snap.data();
  } catch (e) {
    console.error("Error fetching home content:", e);
    return null;
  }
};

window.getCenterContent = async () => {
  try {
    const snap = await getDoc(doc(db, 'contents', 'center'));
    return snap.data();
  } catch (e) {
    console.error("Error fetching center content:", e);
    return null;
  }
};

window.getProcedureContent = async () => {  
  try {
    const snap = await getDoc(doc(db, 'contents', 'procedure'));
    return snap.data();
  } catch (e) {
    console.error("Error fetching procedure content:", e);
    return null;
  }
};

window.getApplyContent = async () => {  
  try {
    const snap = await getDoc(doc(db, 'contents', 'apply'));
    return snap.data();
  } catch (e) {
    console.error("Error fetching apply content:", e);
    return null;
  }
};

window.getExpertsContent = async () => {
  try {
    const snap = await getDoc(doc(db, 'contents', 'experts'));
    return snap.data();
  } catch (e) {
    console.error("Error fetching experts content:", e);
    return null;
  }
};

window.getLocationContent = async () => {
  try {
    const snap = await getDoc(doc(db, 'contents', 'location'));
    return snap.data();
  } catch (e) {
    console.error("Error fetching location content:", e);
    return null;
  }
};

window.getSpecialtiesContent = async () => {
  try {
    const snap = await getDoc(doc(db, 'contents', 'specialties'));
    return snap.data();
  } catch (e) {
    console.error("Error fetching specialties content:", e);
    return null;
  }
};

// 2. 페이지별로 setDoc을 이용한 문서 형식 저장 
window.saveHome = async () => {
  try {
    // 1. Fetch the existing database content
    let original_content = await getHomeContent();
    
    // If the document doesn't exist at all, default to an empty object to prevent errors

    if (!original_content) {
      original_content = {};
    }

    const homeDocRef = doc(db, "contents", "index");
    
    // 2. Save document using Optional Chaining (?.) for safe fallback inheritance
    await setDoc(homeDocRef, {
      "home-session1": {
        "home-session1-tag": sessionStorage.getItem("home-session1-tag") || 
                             original_content["home-session1"]?.["home-session1-tag"] || 
                             document.getElementById("home-session1-tag")?.innerText || "", 
        "home-session1-title": sessionStorage.getItem("home-session1-title") || 
                               original_content["home-session1"]?.["home-session1-title"] || 
                               document.getElementById("home-session1-title")?.innerText || "", 
        "home-session1-sub": sessionStorage.getItem("home-session1-sub") || 
                             original_content["home-session1"]?.["home-session1-sub"] || 
                             document.getElementById("home-session1-sub")?.innerText || ""
      }, 
      "home-session2": {
        "home-session2-tag": sessionStorage.getItem("home-session2-tag") || 
                             original_content["home-session2"]?.["home-session2-tag"] || 
                             document.getElementById("home-session2-tag")?.innerText || "", 
        "home-session2-title": sessionStorage.getItem("home-session2-title") || 
                               original_content["home-session2"]?.["home-session2-title"] || 
                               document.getElementById("home-session2-title")?.innerText || "", 
        "home-session2-sub": sessionStorage.getItem("home-session2-sub") || 
                             original_content["home-session2"]?.["home-session2-sub"] || 
                             document.getElementById("home-session2-sub")?.innerText || ""
      }, 
      "home-session3": {
        "home-session3-tag": sessionStorage.getItem("home-session3-tag") || 
                             original_content["home-session3"]?.["home-session3-tag"] || 
                             document.getElementById("home-session3-tag")?.innerText || "", 
        "home-session3-title": sessionStorage.getItem("home-session3-title") || 
                               original_content["home-session3"]?.["home-session3-title"] || 
                               document.getElementById("home-session3-title")?.innerText || "", 
        "home-session3-sub": sessionStorage.getItem("home-session3-sub") || 
                             original_content["home-session3"]?.["home-session3-sub"] || 
                             document.getElementById("home-session3-sub")?.innerText || ""
      },  
      "home-session4": {
        "home-session4-tag": sessionStorage.getItem("home-session4-tag") || 
                             original_content["home-session4"]?.["home-session4-tag"] || 
                             document.getElementById("home-session4-tag")?.innerText || "", 
        "home-session4-title": sessionStorage.getItem("home-session4-title") || 
                               original_content["home-session4"]?.["home-session4-title"] || 
                               document.getElementById("home-session4-title")?.innerText || "", 
        "home-session4-sub": sessionStorage.getItem("home-session4-sub") || 
                             original_content["home-session4"]?.["home-session4-sub"] || 
                             document.getElementById("home-session4-sub")?.innerText || ""
      }, 
      "home-session5": {
        "home-session5-tag": sessionStorage.getItem("home-session5-tag") || 
                             original_content["home-session5"]?.["home-session5-tag"] || 
                             document.getElementById("home-session5-tag")?.innerText || "", 
        "home-session5-title": sessionStorage.getItem("home-session5-title") || 
                               original_content["home-session5"]?.["home-session5-title"] || 
                               document.getElementById("home-session5-title")?.innerText || "", 
        "home-session5-sub": sessionStorage.getItem("home-session5-sub") || 
                             original_content["home-session5"]?.["home-session5-sub"] || 
                             document.getElementById("home-session5-sub")?.innerText || ""
      }               
    });
  } catch (error) {
    console.error("Error inside saveHome:", error);
    throw error; // Passes the error up to saveAll's catch block properly
  }
};

window.saveCenter = async () => {
  try {
    // 1. Fetch existing content from the database
    let original_content = await getCenterContent();
    
    // Safety check: If the document doesn't exist, default to a blank object
    if (!original_content) {
      original_content = {};
    }

    // 2. Establish the reference using the modern Modular SDK syntax
    const centerDocRef = doc(db, "contents", "center");

    // 3. Save the document with clean fallback chains using optional chaining (?.)
    await setDoc(centerDocRef, {
      "center-tag": (sessionStorage.getItem("center-tag") || 
                    original_content["center-tag"] || 
                    document.getElementById("center-tag")?.innerText || ""),

      "center-session1": {
        "center-title1": sessionStorage.getItem("center-title1") || 
                         original_content["center-session1"]?.["center-title1"] || 
                         document.getElementById("center-title1")?.innerText,
        "center-body1": sessionStorage.getItem("center-body1") || 
                        original_content["center-session1"]?.["center-body1"] || 
                        document.getElementById("center-body1")?.innerText
      },

      "center-session2": {
        "center-title2_1": sessionStorage.getItem("center-title2_1") || 
                           original_content["center-session2"]?.["center-title2_1"] || 
                           document.getElementById("center-title2_1")?.innerText,
        "center-body2_1": sessionStorage.getItem("center-body2_1") || 
                          original_content["center-session2"]?.["center-body2_1"] || 
                          document.getElementById("center-body2_1")?.innerText,
        "center-title2_2": sessionStorage.getItem("center-title2_2") || 
                           original_content["center-session2"]?.["center-title2_2"] || 
                           document.getElementById("center-title2_2")?.innerText,
        "center-body2_2": sessionStorage.getItem("center-body2_2") || 
                          original_content["center-session2"]?.["center-body2_2"] || 
                          document.getElementById("center-body2_2")?.innerText,
        "center-title2_3": sessionStorage.getItem("center-title2_3") || 
                           original_content["center-session2"]?.["center-title2_3"] || 
                           document.getElementById("center-title2_3")?.innerText,
        "center-body2_3": sessionStorage.getItem("center-body2_3") || 
                          original_content["center-session2"]?.["center-body2_3"] || 
                          document.getElementById("center-body2_3")?.innerText,
        "center-title2_4": sessionStorage.getItem("center-title2_4") || 
                           original_content["center-session2"]?.["center-title2_4"] || 
                           document.getElementById("center-title2_4")?.innerText,
        "center-body2_4": sessionStorage.getItem("center-body2_4") || 
                           original_content["center-session2"]?.["center-body2_4"] || 
                           document.getElementById("center-body2_4")?.innerText
      }
    });

    console.log("Center content saved successfully.");
  } catch (error) {
    console.error("Error inside saveCenter:", error);
    throw error; // Re-throw so saveAll() can handle the toast error message
  }
};

window.saveProcedure = async () => {
  try {
    // 1. Fetch the existing database content
    let original_content = await getProcedureContent();
    
    // Safety check: If the document doesn't exist yet, initialize as a blank object
    if (!original_content) {
      original_content = {};
    }

    // 2. Establish the reference using the modern Modular SDK syntax
    const procedureDocRef = doc(db, "contents", "procedure");

    // 3. Save the document with clean fallback chains using optional chaining (?.)
    await setDoc(procedureDocRef, {
      "procedure-main": {
        "procedure-tag": sessionStorage.getItem("procedure-tag") || 
                         original_content["procedure-main"]?.["procedure-tag"] || 
                         document.getElementById("procedure-tag")?.innerText,
        "procedure-title": sessionStorage.getItem("procedure-title") || 
                           original_content["procedure-main"]?.["procedure-title"] || 
                           document.getElementById("procedure-title")?.innerText,
        "procedure-subtitle": sessionStorage.getItem("procedure-subtitle") || 
                              original_content["procedure-main"]?.["procedure-subtitle"] || 
                              document.getElementById("procedure-subtitle")?.innerText
      },

      "procedure-section1": {
        "procedure-section1-title": sessionStorage.getItem("procedure-section1-title") || 
                                    original_content["procedure-section1"]?.["procedure-section1-title"] || 
                                    document.getElementById("procedure-section1-title")?.innerText,
        
        "procedure-section1-body1-title": sessionStorage.getItem("procedure-section1-body1-title") || 
                                         original_content["procedure-section1"]?.["procedure-section1-body1-title"] || 
                                         document.getElementById("procedure-section1-body1-title")?.innerText,
        "procedure-section1-body1-description": sessionStorage.getItem("procedure-section1-body1-description") || 
                                               original_content["procedure-section1"]?.["procedure-section1-body1-description"] || 
                                               document.getElementById("procedure-section1-body1-description")?.innerText,

        "procedure-section1-body2-title": sessionStorage.getItem("procedure-section1-body2-title") || 
                                         original_content["procedure-section1"]?.["procedure-section1-body2-title"] || 
                                         document.getElementById("procedure-section1-body2-title")?.innerText,
        "procedure-section1-body2-description": sessionStorage.getItem("procedure-section1-body2-description") || 
                                               original_content["procedure-section1"]?.["procedure-section1-body2-description"] || 
                                               document.getElementById("procedure-section1-body2-description")?.innerText,

        "procedure-section1-body3-title": sessionStorage.getItem("procedure-section1-body3-title") || 
                                         original_content["procedure-section1"]?.["procedure-section1-body3-title"] || 
                                         document.getElementById("procedure-section1-body3-title")?.innerText,
        "procedure-section1-body3-description": sessionStorage.getItem("procedure-section1-body3-description") || 
                                               original_content["procedure-section1"]?.["procedure-section1-body3-description"] || 
                                               document.getElementById("procedure-section1-body3-description")?.innerText,

        "procedure-section1-body4-title": sessionStorage.getItem("procedure-section1-body4-title") || 
                                         original_content["procedure-section1"]?.["procedure-section1-body4-title"] || 
                                         document.getElementById("procedure-section1-body4-title")?.innerText,
        "procedure-section1-body4-description": sessionStorage.getItem("procedure-section1-body4-description") || 
                                               original_content["procedure-section1"]?.["procedure-section1-body4-description"] || 
                                               document.getElementById("procedure-section1-body4-description")?.innerText
      },

      "procedure-section2": {
        "procedure-section2-title": sessionStorage.getItem("procedure-section2-title") || 
                                    original_content["procedure-section2"]?.["procedure-section2-title"] || 
                                    document.getElementById("procedure-section2-title")?.innerText,
        
        "procedure-section2-body1-title": sessionStorage.getItem("procedure-section2-body1-title") || 
                                         original_content["procedure-section2"]?.["procedure-section2-body1-title"] || 
                                         document.getElementById("procedure-section2-body1-title")?.innerText,
        "procedure-section2-body1-description": sessionStorage.getItem("procedure-section2-body1-description") || 
                                               original_content["procedure-section2"]?.["procedure-section2-body1-description"] || 
                                               document.getElementById("procedure-section2-body1-description")?.innerText,

        "procedure-section2-body2-title": sessionStorage.getItem("procedure-section2-body2-title") || 
                                         original_content["procedure-section2"]?.["procedure-section2-body2-title"] || 
                                         document.getElementById("procedure-section2-body2-title")?.innerText,
        "procedure-section2-body2-description": sessionStorage.getItem("procedure-section2-body2-description") || 
                                               original_content["procedure-section2"]?.["procedure-section2-body2-description"] || 
                                               document.getElementById("procedure-section2-body2-description")?.innerText,

        "procedure-section2-body3-title": sessionStorage.getItem("procedure-section2-body3-title") || 
                                         original_content["procedure-section2"]?.["procedure-section2-body3-title"] || 
                                         document.getElementById("procedure-section2-body3-title")?.innerText,
        "procedure-section2-body3-description": sessionStorage.getItem("procedure-section2-body3-description") || 
                                               original_content["procedure-section2"]?.["procedure-section2-body3-description"] || 
                                               document.getElementById("procedure-section2-body3-description")?.innerText,

        "procedure-section2-body4-title": sessionStorage.getItem("procedure-section2-body4-title") || 
                                         original_content["procedure-section2"]?.["procedure-section2-body4-title"] || 
                                         document.getElementById("procedure-section2-body4-title")?.innerText,
        "procedure-section2-body4-description": sessionStorage.getItem("procedure-section2-body4-description") || 
                                               original_content["procedure-section2"]?.["procedure-section2-body4-description"] || 
                                               document.getElementById("procedure-section2-body4-description")?.innerText
      }
    });

    console.log("Procedure content saved successfully.");
  } catch (error) {
    console.error("Error inside saveProcedure:", error);
    throw error; // Essential to halt saveAll() if an error happens
  }
};

window.saveApplyContent = async () => {
  try {
    // 1. Fetch the existing database content
    let original_content = await getApplyContent();
    
    // Safety check: If the document doesn't exist, initialize as an empty object
    if (!original_content) {
      original_content = {};
    }

    // 2. Establish the document reference using modern Modular SDK syntax
    const applyDocRef = doc(db, "contents", "apply");

    // 3. Save the document with clean fallback chains and structural nesting
    await setDoc(applyDocRef, {
      "contact-tag": sessionStorage.getItem("contact-tag") || 
                    original_content["contact-tag"] || 
                    document.getElementById("contact-tag")?.innerText,

      "contact-session1": {
        "contact-subtitle1": sessionStorage.getItem("contact-subtitle1") || 
                             original_content["contact-session1"]?.["contact-subtitle1"] || 
                             document.getElementById("contact-subtitle1")?.innerText,
        "contact-description1": sessionStorage.getItem("contact-description1") || 
                               original_content["contact-session1"]?.["contact-description1"] || 
                               document.getElementById("contact-description1")?.innerText
      },

      "contact-session2": {
        "contact-subtitle2": sessionStorage.getItem("contact-subtitle2") || 
                             original_content["contact-session2"]?.["contact-subtitle2"] || 
                             document.getElementById("contact-subtitle2")?.innerText,
        "contact-subtitle2-value1": sessionStorage.getItem("contact-subtitle2-value1") || 
                                    original_content["contact-session2"]?.["contact-subtitle2-value1"] || 
                                    document.getElementById("contact-subtitle2-value1")?.innerText,
        "contact-subtitle2-value2": sessionStorage.getItem("contact-subtitle2-value2") || 
                                    original_content["contact-session2"]?.["contact-subtitle2-value2"] || 
                                    document.getElementById("contact-subtitle2-value2")?.innerText,
        // 💡 Fixed Bug: The key below was originally overwritten as "contact-subtitle2-value1"
        "contact-subtitle2-value3": sessionStorage.getItem("contact-subtitle2-value3") || 
                                    original_content["contact-session2"]?.["contact-subtitle2-value3"] || 
                                    document.getElementById("contact-subtitle2-value3")?.innerText
      },

      "contact-session3": {
        "contact-subtitle3": sessionStorage.getItem("contact-subtitle3") || 
                             original_content["contact-session3"]?.["contact-subtitle3"] || 
                             document.getElementById("contact-subtitle3")?.innerText,
        "contact-subtitle3-description": sessionStorage.getItem("contact-subtitle3-description") || 
                                         original_content["contact-session3"]?.["contact-subtitle3-description"] || 
                                         document.getElementById("contact-subtitle3-description")?.innerText
      },

      "contact-form": {
        "contact-form-note1": sessionStorage.getItem("contact-form-note1") || 
                              original_content["contact-form"]?.["contact-form-note1"] || 
                              document.getElementById("contact-form-note1")?.innerText,
        "contact-form-note2": sessionStorage.getItem("contact-form-note2") || 
                              original_content["contact-form"]?.["contact-form-note2"] || 
                              document.getElementById("contact-form-note2")?.innerText,
        "contact-form-note3": sessionStorage.getItem("contact-form-note3") || 
                              original_content["contact-form"]?.["contact-form-note3"] || 
                              document.getElementById("contact-form-note3")?.innerText
      }
    });

    console.log("Apply content saved successfully.");
  } catch (error) {
    console.error("Error inside saveApplyContent:", error);
    throw error; // Propagates the error up to saveAll's catch block cleanly
  }
};

window.saveExpertsContent = async () => {
  try {
    // 1. Fetch the existing database content
    let original_content = await getExpertsContent();
    
    // Safety check: If the document doesn't exist, initialize as an empty object
    if (!original_content) {
      original_content = {};
    }

    // 2. Establish the document reference using modern Modular SDK syntax
    const expertsDocRef = doc(db, "contents", "experts");

    // 3. Save the document with clean fallback chains (Flat Structure)
    await setDoc(expertsDocRef, {
      "experts-tag": sessionStorage.getItem("experts-tag") || 
                     original_content["experts-tag"] || 
                     document.getElementById("experts-tag")?.innerText,

      "experts-title": sessionStorage.getItem("experts-title") || 
                        original_content["experts-title"] || 
                        document.getElementById("experts-title")?.innerText,

      "experts-card-greeting": sessionStorage.getItem("experts-card-greeting") || 
                               original_content["experts-card-greeting"] || 
                               document.getElementById("experts-card-greeting")?.innerText,

      "experts-card-qualification": sessionStorage.getItem("experts-card-qualification") || 
                                    original_content["experts-card-qualification"] || 
                                    document.getElementById("experts-card-qualification")?.innerText,

      "experts-card-target": sessionStorage.getItem("experts-card-target") || 
                             original_content["experts-card-target"] || 
                             document.getElementById("experts-card-target")?.innerText,

      "experts-card-fields": sessionStorage.getItem("experts-card-fields") || 
                             original_content["experts-card-fields"] || 
                             document.getElementById("experts-card-fields")?.innerText,

      "experts-card-career": sessionStorage.getItem("experts-card-career") || 
                             original_content["experts-card-career"] || 
                             document.getElementById("experts-card-career")?.innerText,

      "experts-card-education": sessionStorage.getItem("experts-card-education") || 
                               original_content["experts-card-education"] || 
                               document.getElementById("experts-card-education")?.innerText
    });

    console.log("Experts content saved successfully.");
  } catch (error) {
    console.error("Error inside saveExpertsContent:", error);
    throw error; // Propagates the error up to saveAll's catch block cleanly
  }
};

window.saveLocationContent = async () => {
  try {
    // 1. Fetch the existing database content safely
    let original_content = await getLocationContent();
    
    // Guardrail check: If document doesn't exist, fall back to a blank object
    if (!original_content) {
      original_content = {};
    }

    // 2. Establish the document reference using modern Modular SDK syntax
    const locationDocRef = doc(db, "contents", "location");

    // 3. Save the document with clean fallback chains and structured nesting
    await setDoc(locationDocRef, {
      "location-main": {
        "location-tag": sessionStorage.getItem("location-tag") || 
                        original_content["location-main"]?.["location-tag"] || 
                        document.getElementById("location-tag")?.innerText,
        "location-title": sessionStorage.getItem("location-title") || 
                          original_content["location-main"]?.["location-title"] || 
                          document.getElementById("location-title")?.innerText,
        "location-subtitle1": sessionStorage.getItem("location-subtitle1") || 
                             original_content["location-main"]?.["location-subtitle1"] || 
                             document.getElementById("location-subtitle1")?.innerText
      },

      "location-session1": {
        "location-card-name-title": sessionStorage.getItem("location-card-name-title") || 
                                    original_content["location-session1"]?.["location-card-name-title"] || 
                                    document.getElementById("location-card-name-title")?.innerText,
        "location-card-name-body": sessionStorage.getItem("location-card-name-body") || 
                                   original_content["location-session1"]?.["location-card-name-body"] || 
                                   document.getElementById("location-card-name-body")?.innerText
      },

      "location-session2": {
        "location-card-address-title": sessionStorage.getItem("location-card-address-title") || 
                                       original_content["location-session2"]?.["location-card-address-title"] || 
                                       document.getElementById("location-card-address-title")?.innerText,
        "location-card-address-body": sessionStorage.getItem("location-card-address-body") || 
                                      original_content["location-session2"]?.["location-card-address-body"] || 
                                      document.getElementById("location-card-address-body")?.innerText
      },

      "location-session3": {
        "location-card-phone-title": sessionStorage.getItem("location-card-phone-title") || 
                                     original_content["location-session3"]?.["location-card-phone-title"] || 
                                     document.getElementById("location-card-phone-title")?.innerText,
        "location-card-phone-body": sessionStorage.getItem("location-card-phone-body") || 
                                    original_content["location-session3"]?.["location-card-phone-body"] || 
                                    document.getElementById("location-card-phone-body")?.innerText
      },

      "location-session4": {
        "location-card-email-title": sessionStorage.getItem("location-card-email-title") || 
                                     original_content["location-session4"]?.["location-card-email-title"] || 
                                     document.getElementById("location-card-email-title")?.innerText,
        "location-card-email-body": sessionStorage.getItem("location-card-email-body") || 
                                    original_content["location-session4"]?.["location-card-email-body"] || 
                                    document.getElementById("location-card-email-body")?.innerText
      },

      "location-session5": {
        "location-card-subway-title": sessionStorage.getItem("location-card-subway-title") || 
                                      original_content["location-session5"]?.["location-card-subway-title"] || 
                                      document.getElementById("location-card-subway-title")?.innerText,
        "location-card-subway-body1": sessionStorage.getItem("location-card-subway-body1") || 
                                      original_content["location-session5"]?.["location-card-subway-body1"] || 
                                      document.getElementById("location-card-subway-body1")?.innerText, 
        "location-card-subway-body2": sessionStorage.getItem("location-card-subway-body2") || 
                                      original_content["location-session5"]?.["location-card-subway-body2"] || 
                                      document.getElementById("location-card-subway-body2")?.innerText,                                 
      },

      "location-session6": {
        "location-card-bus-title": sessionStorage.getItem("location-card-bus-title") || 
                                   original_content["location-session6"]?.["location-card-bus-title"] || 
                                   document.getElementById("location-card-bus-title")?.innerText,
        "location-card-bus-body": sessionStorage.getItem("location-card-bus-body") || 
                                  original_content["location-session6"]?.["location-card-bus-body"] || 
                                  document.getElementById("location-card-bus-body")?.innerText
      }
    });

    console.log("Location content saved successfully.");
  } catch (error) {
    console.error("Error inside saveLocationContent:", error);
    throw error; // Allows saveAll() catch block to capture the failure smoothly
  }
};

window.saveSpecialtiesContent = async () => {
  try {
    // 1. Safely fetch the existing specialties content from the database
    let original_content = await getSpecialtiesContent();
    
    // Safety check: If the document is uninitialized, fall back to an empty object
    if (!original_content) {
      original_content = {};
    }

    // 2. Create the document reference using modern Modular SDK syntax
    const specialtiesDocRef = doc(db, "contents", "specialties");

    // 3. Write the document utilizing clean fallback chains and structured objects
    await setDoc(specialtiesDocRef, {
      "fields-main": {
        "fields-tag": sessionStorage.getItem("fields-tag") || 
                      original_content["fields-main"]?.["fields-tag"] || 
                      document.getElementById("fields-tag")?.innerText,
        "fields-title": sessionStorage.getItem("fields-title") || 
                        original_content["fields-main"]?.["fields-title"] || 
                        document.getElementById("fields-title")?.innerText
      },

      "fields-session1": {
        "fields-card1-title": sessionStorage.getItem("fields-card1-title") || 
                              original_content["fields-session1"]?.["fields-card1-title"] || 
                              document.getElementById("fields-card1-title")?.innerText,
        "fields-card1-description": sessionStorage.getItem("fields-card1-description") || 
                                    original_content["fields-session1"]?.["fields-card1-description"] || 
                                    document.getElementById("fields-card1-description")?.innerText
      },

      "fields-session2": {
        "fields-card2-title": sessionStorage.getItem("fields-card2-title") || 
                              original_content["fields-session2"]?.["fields-card2-title"] || 
                              document.getElementById("fields-card2-title")?.innerText,
        "fields-card2-description": sessionStorage.getItem("fields-card2-description") || 
                                    original_content["fields-session2"]?.["fields-card2-description"] || 
                                    document.getElementById("fields-card2-description")?.innerText
      },

      "fields-session3": {
        "fields-card3-title": sessionStorage.getItem("fields-card3-title") || 
                              original_content["fields-session3"]?.["fields-card3-title"] || 
                              document.getElementById("fields-card3-title")?.innerText,
        "fields-card3-description": sessionStorage.getItem("fields-card3-description") || 
                                    original_content["fields-session3"]?.["fields-card3-description"] || 
                                    document.getElementById("fields-card3-description")?.innerText
      },

      "fields-session4": {
        "fields-card4-title": sessionStorage.getItem("fields-card4-title") || 
                              original_content["fields-session4"]?.["fields-card4-title"] || 
                              document.getElementById("fields-card4-title")?.innerText,
        "fields-card4-description": sessionStorage.getItem("fields-card4-description") || 
                                    original_content["fields-session4"]?.["fields-card4-description"] || 
                                    document.getElementById("fields-card4-description")?.innerText
      },

      "fields-session5": {
        "fields-card5-title": sessionStorage.getItem("fields-card5-title") || 
                              original_content["fields-session5"]?.["fields-card5-title"] || 
                              document.getElementById("fields-card5-title")?.innerText,
        "fields-card5-description": sessionStorage.getItem("fields-card5-description") || 
                                    original_content["fields-session5"]?.["fields-card5-description"] || 
                                    document.getElementById("fields-card5-description")?.innerText
      },

      "fields-session6": {
        "fields-card6-title": sessionStorage.getItem("fields-card6-title") || 
                              original_content["fields-session6"]?.["fields-card6-title"] || 
                              document.getElementById("fields-card6-title")?.innerText,
        "fields-card6-description": sessionStorage.getItem("fields-card6-description") || 
                                    original_content["fields-session6"]?.["fields-card6-description"] || 
                                    document.getElementById("fields-card6-description")?.innerText
      }
    });

    console.log("Specialties content saved successfully.");
  } catch (error) {
    console.error("Error inside saveSpecialtiesContent:", error);
    throw error; // Propagates the exception up to your global saveAll execution sequence
  }
};



// 3. set / upate logic 구현 
// [수정 로직]
// 1) active / non-active 판별  | 페이지별로 active한 상황에서만 ID를 찾을 수 있음; 
// 2) active 상황: save 기존 함수 활용 / non-active 상황 : skip 
// 3) 수정한 페이지에서 저장 버튼 클릭하도록 유도; (alert 알림, 저장 클릭 없이 이동할 경우 수정 데이터 손실 경고) 

// IDEA ; switch 함수 활용
window.checkCurrentPage = function() {
  const url = window.location.href;
  console.log("현재 URL:", url); // Debugging log to verify URL structure
  
  // URL에서 파일명만 정확하게 추출 (예: /pages/center_into.html -> center_into)
  const pageName = url.split("/").pop().replace(".html", "").trim();
  console.log("추출된 페이지 이름:", pageName); // Debugging log to verify page name extraction

  if (url.includes("index")) return "home";
  else if (url.includes("apply")) return "apply";
  else if (url.includes("center_into")) return "center";
  else if (url.includes("procedure")) return "procedure";
  else if (url.includes("experts")) return "experts";
  else if (url.includes("location")) return "location";
  else if (url.includes("specialties")) return "specialties";
  else if(pageName === "") return "home"; // URL이 루트이거나 파일명이 없는 경우 홈으로 간주
  else return null;
};

window.setUnsavedChanges = function() {
  const savedbtn = document.getElementById('savedbtn');
  sessionStorage.setItem("unsavedChanges", "true");
}

window.listenSaveButton = function() {
  const savedbtn = document.getElementById('savedbtn');
  if (savedbtn) {
    savedbtn.addEventListener('click', () => {
      sessionStorage.setItem("unsavedChanges", "false");
      alert("저장되었습니다."); // 저장 알림
    });
  }
};

window.alertUnsavedChanges = function() {
  if (sessionStorage.getItem("unsavedChanges") === "true") {
    return confirm("저장버튼을 누르지 않으면 변경 사항은 저장되지 않습니다. 페이지를 이동하시겠습니까?");
  }
  return true; // No unsaved changes, allow navigation
}; 

// window.activePageSaveHandler = async function() 
// { // DOMContent Loaded 이후에 실행되어야 함 (저장 버튼 클릭 시점)
//   let currentPage = window.checkCurrentPage();
//   switch (currentPage) {
//     case "home": await saveHome(); break;
//     case "apply": await saveApplyContent(); break;
//     case "center": await saveCenter(); break;
//     case "procedure": await saveProcedure(); break;
//     case "experts": await saveExpertsContent(); break;
//     case "location": await saveLocationContent(); break;
//     case "specialties": await saveSpecialtiesContent(); break;
//   }

// };


// // 4. UI 반영 수정 


// window.saveAll = async () => {
//   const adminBar = document.getElementById('admin-bar');
//   if (!adminBar || !adminBar.classList.contains('on')) return;

//   try {
//     // window.setUnsavedChanges(); 
//     // // window.listenSaveButton(); // userEffect처럼 저장 버튼 클릭 리스너 등록 (저장 후 unsavedChanges 플래그 초기화)
//     // await activePageSaveHandler(); 
//     // window.alertUnsavedChanges();   
 
//     // const newData = {};
//     // // Collect all editable fields except those inside the expert grid
//     // document.querySelectorAll('[id^="e-"], [id^="img-"]').forEach(el => {
//     //   if (el.closest('#expert-dynamic-grid')) return; // Skip experts (they auto-save)
      
//     //   if (el.tagName === 'IMG') newData[el.id] = el.src;
//     //   else newData[el.id] = el?.innerText;
//     // });

//     // await setDoc(doc(db, 'site', 'content'), newData);

//     showToast("사이트 설정이 저장되었습니다. (전문가 정보는 실시간 저장됨)");
//   } catch (e) {
//     console.error("Save Error:", e);
//     showToast("저장 중 오류가 발생했습니다.", "err");
//   }
// };

// 1. 기존의 페이지별 체크 및 저장 핸들러
// window.activePageSaveHandler = async function() {
//   let currentPage = window.checkCurrentPage();
//   switch (currentPage) {
//     case "home": await saveHome(); break;
//     case "apply": await saveApplyContent(); break;
//     case "center": await saveCenter(); break;
//     case "procedure": await saveProcedure(); break;
//     case "experts": await saveExpertsContent(); break;
//     case "location": await saveLocationContent(); break;
//     case "specialties": await saveSpecialtiesContent(); break;
//   }
// };

// 1. 현재 활성화된 페이지의 저장 함수만 안전하게 호출하는 핸들러
window.activePageSaveHandler = async function() {
  let currentPage = window.checkCurrentPage();

  console.log("현재 감지된 페이지:", currentPage);
  
  if (!currentPage) {
    console.warn("현재 페이지를 감지할 수 없어 저장을 스킵합니다.");
    return false;
  }

  try {
    switch (currentPage) {
      case "home": await saveHome(); break;
      case "apply": await saveApplyContent(); break;
      case "center": await saveCenter(); break;
      case "procedure": await saveProcedure(); break;
      case "experts": await saveExpertsContent(); break;
      case "location": await saveLocationContent(); break;
      case "specialties": await saveSpecialtiesContent(); break;
      default: return false;
    }
    return true; // 성공적으로 매핑되어 저장이 완료됨
  } catch (error) {
    console.error(`${currentPage} 저장 중 치명적 에러 발생:`, error);
    throw error; // 상위 saveAll로 에러 전달
  }
};

// 2. 통합 저장 함수 수정

// window.saveAll = async function() {
//   console.log("저장 프로세스 시작...");
  
//   // DOM이 이미 로드된 상태에서 안전하게 현재 페이지를 체크하고 저장 진행
//   await window.activePageSaveHandler();
  
//   console.log("저장 프로세스 완료!");
// };


window.saveAll = async function() {
  const adminBar = document.getElementById('admin-bar');
  // 관리자 모드가 꺼져 있다면 실행 방지
  if (!adminBar || !adminBar.classList.contains('on')) {
    showToast("관리자 권한이 없거나 편집 모드가 아닙니다.", "err");
    return;
  }

  try {
    console.log("저장 프로세스 시작...");
    showToast("데이터를 저장 중입니다...");
    
    // 현재 활성 페이지 저장 로직 호출
    const success = await window.activePageSaveHandler();
    
    if (success) {
      showToast("✓ 현재 페이지 설정이 성공적으로 저장되었습니다.", "ok");
      console.log("저장 프로세스 완료!");
      // 저장 성공 후 변경사항 플래그 초기화
      sessionStorage.setItem("unsavedChanges", "false");
    } else {
      showToast("저장할 페이지를 찾지 못했습니다.", "err");
    }
  } catch (e) {
    console.error("Save All 전역 에러:", e);
    showToast("저장 중 오류가 발생했습니다. 콘솔을 확인하세요.", "err");
  }
};




// 3. DOM이 로드되면 HTML 저장 버튼에 saveAll 함수를 연결
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('my-save-button'); // 실제 버튼 ID
  if (saveBtn) {
    saveBtn.addEventListener('click', window.saveAll);
  }
});

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

   function save_Editable_Contents(editor, storageKey){
      if(!editor) return;
      editor.addEventListener('input', ()=>{
          const content = editor?.innerText;
          sessionStorage.setItem(storageKey, content);
          console.log(`저장된 ${storageKey}:`, content);
      });
   }



  function state_isEditable(){
    const admin_state = document.getElementById('admin-bar');
    const adminBar = document.getElementById('admin-bar');
    if(adminBar.classList.contains('on')) {
      return true;
    }
    else{
      return false;
    }
  }
  
  function show_statechange_home(){
     const card_list = ['home-session1-tag', 'home-session1-title', 'home-session1-sub',
                        'home-session2-tag', 'home-session2-title', 'home-session2-sub',    
                        'home-session3-tag', 'home-session3-title', 'home-session3-sub',  
                        'home-session4-tag', 'home-session4-title', 'home-session4-sub',
                        'home-session5-tag', 'home-session5-title', 'home-session5-sub',
                        'home-session6-tag', 'home-session6-title', 'home-session6-sub'
     ];
     const editable = state_isEditable();
      card_list.forEach((card) => {
        let card_el = document.getElementById(card);
        if(card_el)card_el.setAttribute('contenteditable', editable.toString());
        save_Editable_Contents(card_el, card);
      });
       
  }

  function show_statechange_apply(){
     const apply_form = ['contact-tag', 'contact-subtitle1', 'contact-description1',
                        'contact-subtitle2', 'contact-subtitle2-value1', 'contact-subtitle2-value2', 'contact-subtitle2-value3',
                        'contact-subtitle3', 'contact-subtitle3-description',
                        'contact-form-note1', 'contact-form-note2', 'contact-form-note3'
     ];
     const editable = state_isEditable();
     apply_form.forEach((form) => {
       let form_el = document.getElementById(form);
       if(form_el)form_el.setAttribute('contenteditable', editable.toString());
       save_Editable_Contents(form_el, form);
     });
  }

  function show_statechange_experts(){
      const expert_sections = ['experts-tag', 'experts-title', 
        'experts-card-greeting', 'experts-card-qualification',
        'experts-card-target', 'experts-card-fields',
        'experts-card-career', 'experts-card-education'
      ];
      const editable = state_isEditable();
      expert_sections.forEach((section) => {
        let section_el = document.getElementById(section);
        if(section_el)section_el.setAttribute('contenteditable', editable.toString());
        save_Editable_Contents(section_el, section);
      });
  }

  function show_statechange_location(){
    const location_section = ['location-tag', 'location-title', 'location-subtitle1', 'location-subtitle2',
      'location-card-name-title', 'location-card-name-body',
      'location-card-address-title', 'location-card-address-body',
      'location-card-phone-title', 'location-card-phone-body',
      'location-card-email-title', 'location-card-email-body',
      'location-card-subway-title', 'location-card-subway-body1', 'location-card-subway-body2',
      'location-card-bus-title', 'location-card-bus-body'
    ];
    const editable = state_isEditable();
    location_section.forEach((section) => {
      let section_el = document.getElementById(section);
      if(section_el)section_el.setAttribute('contenteditable', editable.toString());
      save_Editable_Contents(section_el, section);
    });
  }

  function show_statechange_specialties(){
    const specialties_section = ['fields-tag', 'fields-title',
      'fields-card1-title', 'fields-card1-description',
      'fields-card2-title', 'fields-card2-description',
      'fields-card3-title', 'fields-card3-description',
      'fields-card4-title', 'fields-card4-description',
      'fields-card5-title', 'fields-card5-description',
      'fields-card6-title', 'fields-card6-description'
    ];
    const editable = state_isEditable();
    specialties_section.forEach((section) => {
      let section_el = document.getElementById(section);
      if(section_el)section_el.setAttribute('contenteditable', editable.toString());
      save_Editable_Contents(section_el, section);
    });
  }

  function show_statechange_center(){
    const center_contents = [ 'center-tag',
                              'center-title1', 'center-body1',
                              'center-title2_1', 'center-body2_1',
                              'center-title2_2', 'center-body2_2',
                              'center-title2_3', 'center-body2_3',
                              'center-title2_4', 'center-body2_4']; 
    const editable = state_isEditable();
      center_contents.forEach((content) => { 
        let content_el = document.getElementById(content);
        if(content_el)content_el.setAttribute('contenteditable', editable.toString());
        save_Editable_Contents(content_el, content);
      });
  }

  function show_statechange_procedure(){
      const procedure_contents = [
        'procedure-tag', 'procedure-title', 'procedure-subtitle',
        'procedure-section1-title',  
        'procedure-section1-body1-title', 'procedure-section1-body1-description',
        'procedure-section1-body2-title', 'procedure-section1-body2-description',
        'procedure-section1-body3-title', 'procedure-section1-body3-description',
        'procedure-section1-body4-title', 'procedure-section1-body4-description',
        'procedure-section2-title', 'procedure-section2-subtitle',
        'procedure-section2-body1-title', 'procedure-section2-body1-description',
        'procedure-section2-body2-title', 'procedure-section2-body2-description',
        'procedure-section2-body3-title', 'procedure-section2-body3-description',
        'procedure-section2-body4-title', 'procedure-section2-body4-description'
      ];
      const editable = state_isEditable();
      procedure_contents.forEach((content) => {
        let content_el = document.getElementById(content);
        if(content_el)content_el.setAttribute('contenteditable', editable.toString());
        save_Editable_Contents(content_el, content);
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

 
  // 1. 로그인 핵심 로직 함수 정의
  async function doLogin() {
    const emailEl = document.getElementById('m-id');
    const pwEl = document.getElementById('m-pw');
    const errEl = document.getElementById('m-err'); // 정상적으로 가져옴

    if (!emailEl || !pwEl || !errEl) return;

    const email = emailEl.value.trim();
    const pw = pwEl.value;

    try {
      await signInWithEmailAndPassword(auth, email, pw);
      showToast('✓ 로그인 되었습니다.', 'ok');
      setTimeout(() => { window.location.href = '../index.html'; }, 1000);
    } catch(e) {
      errEl.style.display = 'block'; // 기존 'err.style'에서 'errEl.style'로 수정 (오타 방지)
      pwEl.value = '';
      console.error("로그인 에러:", e);
    }
  }

  // 2. HTML 문서가 완전히 로드된 후 이벤트 리스너 연결
  document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('btn-login');
    const pwInput = document.getElementById('m-pw');

    // 로그인 버튼 클릭 시 실행
    if (loginBtn) {
      loginBtn.addEventListener('click', doLogin);
    }

    // 비밀번호 창에서 엔터키 입력 시 실행
    if (pwInput) {
      pwInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          doLogin();
        }
      });
    }
  });
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
                <div class="exp-name" ${isEdit ? `contenteditable="true" onblur="updateExp('${id}', 'name', this?.innerText)"` : ''}>
                  ${data.name}
                </div>
                <div class="exp-bio" ${isEdit ? `contenteditable="true" onblur="updateExp('${id}', 'bio', this?.innerText)"` : ''}>
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
              ${isEdit ? `contenteditable="true" onblur="updateExp('${id}', 'name', this?.innerText)"` : ''}>
              ${data.name}
            </div>
            <div class="exp-bio"
              ${isEdit ? `contenteditable="true" onblur="updateExp('${id}', 'bio', this?.innerText)"` : ''}>
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

export{db}; 