// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALyF8R_Lq9NTo61oIf3532YgdZsL0-t2E",
  authDomain: "the-friendship-vault.firebaseapp.com",
  projectId: "the-friendship-vault",
  storageBucket: "the-friendship-vault.firebasestorage.app",
  messagingSenderId: "662208007374",
  appId: "1:662208007374:web:5126e99f8b387d4871d49f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);