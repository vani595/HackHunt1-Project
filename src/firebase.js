// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC2CTQrCnT9PvQ2YvJdi3GkZiuK7AcaqQ0",
  authDomain: "hackhunt-b7a17.firebaseapp.com",
  projectId: "hackhunt-b7a17",
  storageBucket: "hackhunt-b7a17.firebasestorage.app",
  messagingSenderId: "867617474506",
  appId: "1:867617474506:web:156211b67f2a209428f133"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();