import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth as getFirebaseAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we're in a browser environment (not during build/SSR)
const isBrowser = typeof window !== 'undefined';

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  if (!isBrowser) return false; // Don't try to initialize during build/SSR
  
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase app lazily
let app: any = null;
export const getFirebaseApp = () => {
  if (!isBrowser) {
    return null;
  }
  
  if (!isFirebaseConfigured()) {
    return null;
  }
  
  if (!app) {
    // Check if app is already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }
  
  return app;
};

// Initialize Firebase services with proper error handling
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export const getAuthInstance = (): Auth | null => {
  if (!isBrowser || !isFirebaseConfigured()) {
    return null;
  }
  
  if (!authInstance) {
    const app = getFirebaseApp();
    if (app) {
      authInstance = getFirebaseAuth(app);
    }
  }
  
  return authInstance;
};

export const getDbInstance = (): Firestore | null => {
  if (!isBrowser || !isFirebaseConfigured()) {
    return null;
  }
  
  if (!dbInstance) {
    const app = getFirebaseApp();
    if (app) {
      dbInstance = getFirestore(app);
    }
  }
  
  return dbInstance;
};

// Export getter functions instead of direct instances
export const auth = getAuthInstance;
export const db = getDbInstance;

export default { getFirebaseApp, isFirebaseConfigured }; 