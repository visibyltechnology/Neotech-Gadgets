import { initializeApp } from "firebase/app";
import { getAuth, fetchSignInMethodsForEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKTK7J1YXicdUF79Yt-eEcDb3ivt8vbIU",
  authDomain: "neo-gadgets.firebaseapp.com",
  projectId: "neo-gadgets",
  storageBucket: "neo-gadgets.firebasestorage.app",
  messagingSenderId: "194636446452",
  appId: "1:194636446452:web:251ae6642f416291e97ca1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    console.log("Checking email...");
    const methods = await fetchSignInMethodsForEmail(auth, "test@example.com");
    console.log("Methods:", methods);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.code, error.message);
    process.exit(1);
  }
}

test();
