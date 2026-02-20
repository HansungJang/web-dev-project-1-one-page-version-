// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHAG_rdo3NxBWEJIGSnt34dYsXeP5G2lg",
  authDomain: "web1-onepage-ver.firebaseapp.com",
  projectId: "web1-onepage-ver",
  storageBucket: "web1-onepage-ver.firebasestorage.app",
  messagingSenderId: "790854514107",
  appId: "1:790854514107:web:a14055b31f90844da8009e",
  measurementId: "G-W9SZPT5JJ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const contentsCol = collection(db, "contents");
export const snapshot = await getDocs(contentsCol);
 
onAuthStateChanged(auth, (user) => {
  if (user != null) { console.log ("manager logged in"); } 
    else { console.log ("no manager logged in"); }  
});
    // User is signed in, you can access user information here       