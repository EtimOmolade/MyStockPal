// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAx3FC0mRBuW98vPAQy0m_1BozNZGPfiho",

  authDomain: "inventory-app-32ec0.firebaseapp.com",

  projectId: "inventory-app-32ec0",

storageBucket: "inventory-app-32ec0.appspot.com",

  messagingSenderId: "700538792559",

  appId: "1:700538792559:web:a4ba6ef4b8db0f8896bb9a",

  measurementId: "G-2YP5DSR8Q3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database)
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);
