import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth as getFirebaseAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

// `npm run dev:emulators` points the app at the local Firebase emulators instead of the real project.
const useEmulators = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === 'true';

const firebaseConfig = {
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
let app: FirebaseApp | null = null;
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
      if (useEmulators) connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
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
      if (useEmulators) connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
    }
  }
  
  return dbInstance;
};

// Export getter functions instead of direct instances
export const auth = getAuthInstance;
export const db = getDbInstance;

const firebase = { getFirebaseApp, isFirebaseConfigured };
export default firebase;