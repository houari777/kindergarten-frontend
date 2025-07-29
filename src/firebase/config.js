// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAycs2MyF7829JOz1eAXmdeIoi2HWzdTgo",
  authDomain: "kindergarten-app-b106d.firebaseapp.com",
  projectId: "kindergarten-app-b106d",
  storageBucket: "kindergarten-app-b106d.appspot.com",
  messagingSenderId: "1048999561967",
  appId: "1:1048999561967:web:05e42c4269c8969e4f691a"
};

// Debug log
console.log('Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: '***' // Don't log the actual API key
});

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configure auth settings
auth.useDeviceLanguage();

// Add CORS headers for development
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode: Setting up CORS-friendly configuration');
}

console.log('Firebase services initialized');

export { app, auth, db, storage };
