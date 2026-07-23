import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAKTK7J1YXicdUF79Yt-eEcDb3ivt8vbIU",
  authDomain: "neo-gadgets.firebaseapp.com",
  projectId: "neo-gadgets",
  storageBucket: "neo-gadgets.firebasestorage.app",
  messagingSenderId: "194636446452",
  appId: "1:194636446452:web:251ae6642f416291e97ca1",
  measurementId: "G-SQHGZ8143G"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
