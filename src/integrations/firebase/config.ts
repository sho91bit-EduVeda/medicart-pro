import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBKG_NTSDqJPHxPXBjc9HFwcpSfe_ADf6M",
  authDomain: "kalyanam-pharmaceuticals.firebaseapp.com",
  projectId: "kalyanam-pharmaceuticals",
  storageBucket: "kalyanam-pharmaceuticals.firebasestorage.app",
  messagingSenderId: "674243081044",
  appId: "1:674243081044:web:d2f109e486fa489f14cec1",
  measurementId: "G-TX24JGCM0Z"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let firestore;
try {
  firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  console.log("Firestore already initialized, using existing instance");
  firestore = getFirestore(app);
}

export const db = firestore;
export const storage = getStorage(app);
