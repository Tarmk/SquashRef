import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
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
    throw new Error('Firebase cannot be initialized during server-side rendering or build time.');
  }
  
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please set up your environment variables.');
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

// Lazy getters for Firebase services
let authInstance: Auth | null = null;
export const auth = new Proxy({} as Auth, {
  get(target, prop) {
    if (!isBrowser) {
      // Return a dummy object during SSR to prevent errors
      return undefined;
    }
    
    if (!authInstance) {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured. Please set up your environment variables.');
      }
      authInstance = getAuth(getFirebaseApp());
    }
    return (authInstance as any)[prop];
  }
});

let dbInstance: Firestore | null = null;
export const db = new Proxy({} as Firestore, {
  get(target, prop) {
    if (!isBrowser) {
      // Return a dummy object during SSR to prevent errors
      return undefined;
    }
    
    if (!dbInstance) {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured. Please set up your environment variables.');
      }
      dbInstance = getFirestore(getFirebaseApp());
    }
    return (dbInstance as any)[prop];
  }
});

export default { getFirebaseApp, isFirebaseConfigured }; 