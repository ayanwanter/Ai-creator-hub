// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Your web app's Firebase configuration
// NOTE: Replace appId with the real one from Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyCMTIhHDAJW6fWiqngicaJfv-frBMOKoGY",
  authDomain: "ai-creator-hub-81745.firebaseapp.com",
  projectId: "ai-creator-hub-81745",
  storageBucket: "ai-creator-hub-81745.appspot.com",
  messagingSenderId: "910987554616",
  appId: "1:910987554616:web:1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Expose on window for script.js
window.firebaseAuth = { auth, provider, signInWithPopup, signOut, onAuthStateChanged };
window.firebaseDb = { db, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove };

// Dispatch a custom event so script.js knows Firebase is ready
// (ES modules execute AFTER regular scripts, so we can't rely on DOMContentLoaded order)
window.dispatchEvent(new CustomEvent('firebase-ready'));
