import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyAhClLvAdEiz8do8WfsTZn-qKFqfvia_uc",
  authDomain: "freshcow-ith.firebaseapp.com",
  databaseURL: "https://freshcow-ith-default-rtdb.firebaseio.com",
  projectId: "freshcow-ith",
  storageBucket: "freshcow-ith.firebasestorage.app",
  messagingSenderId: "283897248652",
  appId: "1:283897248652:web:236f73950ea2b28959f4a9",
  measurementId: "G-3VE84RC7YE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getDatabase(app);
