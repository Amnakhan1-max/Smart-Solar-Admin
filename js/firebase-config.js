// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, getDoc, query, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHeQY0lvfGMfF6oU_f9pmQciBuDQutYy4",
    authDomain: "smartsolar-58e95.firebaseapp.com",
    projectId: "smartsolar-58e95",
    storageBucket: "smartsolar-58e95.firebasestorage.app",
    messagingSenderId: "996412775119",
    appId: "1:996412775119:web:270bcb56cefc5a6429f5ba",
    measurementId: "G-M742NLPMJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Check if user is logged in
let currentUser = null;
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

export { app, db, storage, auth, currentUser };
export { collection, getDocs, addDoc, doc, deleteDoc, getDoc, query, orderBy, limit, startAfter };
export { ref, uploadBytes, getDownloadURL };
export { signInWithEmailAndPassword, onAuthStateChanged, signOut };