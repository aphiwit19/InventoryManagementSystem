// Minimal Firebase initialization for Authentication
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace these placeholders with your Firebase project's web app config
// You can find it in Firebase Console → Project settings → Your apps → SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1eB9H3EP9bBGZOY6G46tjCDU6G6NuKqc",
  authDomain: "internship-173fa.firebaseapp.com",
  projectId: "internship-173fa",
  storageBucket: "internship-173fa.firebasestorage.app",
  messagingSenderId: "835291171321",
  appId: "1:835291171321:web:055e07371c859a392f1528",
  measurementId: "G-0EXL4LH93B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


