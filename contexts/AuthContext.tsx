'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

import { auth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
  const [mounted, setMounted] = useState(false);

  async function signup(email: string, password: string, displayName: string) {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please set up your environment variables.');
    }
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    setCurrentUser(user);
  }

  async function login(email: string, password: string) {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please set up your environment variables.');
    }
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please set up your environment variables.');
    }
    await signOut(auth);
  }

  useEffect(() => {
    // Mark component as mounted to avoid hydration issues
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run Firebase config check after component is mounted
    if (!mounted) return;

    // Check Firebase configuration by testing if Firebase app is properly initialized
    const checkFirebaseConfig = () => {
      try {
        // Try to access the Firebase app configuration
        const app = auth.app;
        const config = app.options;
        
        // Check if all required config values are present
        const isConfigured = !!(
          config.apiKey &&
          config.authDomain &&
          config.projectId &&
          config.storageBucket &&
          config.messagingSenderId &&
          config.appId
        );

        return isConfigured;
      } catch (error) {
        console.warn('Firebase config check failed:', error);
        return false;
      }
    };

    const configured = checkFirebaseConfig();
    setIsFirebaseConfigured(configured);
    
    // Only set up auth listener if Firebase is configured
    if (configured) {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.warn('Firebase auth initialization failed:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [mounted]);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    isFirebaseConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 