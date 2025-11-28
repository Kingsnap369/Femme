
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ====================================================================================
// Configuration de Firebase
// ====================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyASrr3MlvVK7UtIBProRzrp16haXcoXZCo",
  authDomain: "cycle-f953b.firebaseapp.com",
  projectId: "cycle-f953b",
  storageBucket: "cycle-f953b.firebasestorage.app",
  messagingSenderId: "648952233236",
  appId: "1:648952233236:web:ff1e625b8f5557977cd601"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = 'fr'; // Set language to French for emails

// Initialize Firestore with offline persistence enabled, with fallback
let dbInstance;
try {
    dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
} catch (error) {
    console.warn("Firestore persistence failed to initialize (likely due to browser restrictions), falling back to default memory persistence:", error);
    dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const storage = getStorage(app);
