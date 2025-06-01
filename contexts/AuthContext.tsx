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

import { auth, isFirebaseConfigured } from '../lib/firebase';

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
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [mounted, setMounted] = useState(false);

  async function signup(email: string, password: string, displayName: string) {
    if (typeof window === 'undefined') {
      throw new Error('Authentication is not available during server-side rendering.');
    }
    if (!firebaseConfigured) {
      throw new Error('Firebase is not configured. Please set up your environment variables.');
    }
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    setCurrentUser(user);
  }

  async function login(email: string, password: string) {
    if (typeof window === 'undefined') {
      throw new Error('Authentication is not available during server-side rendering.');
    }
    if (!firebaseConfigured) {
      throw new Error('Firebase is not configured. Please set up your environment variables.');
    }
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (typeof window === 'undefined') {
      throw new Error('Authentication is not available during server-side rendering.');
    }
    if (!firebaseConfigured) {
      throw new Error('Firebase is not configured. Please set up your environment variables.');
    }
    await signOut(auth);
  }

  useEffect(() => {
    // Mark component as mounted to avoid hydration issues
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run Firebase config check after component is mounted and in browser
    if (!mounted || typeof window === 'undefined') return;

    // Check Firebase configuration using the centralized function
    try {
      const configured = isFirebaseConfigured();
      setFirebaseConfigured(configured);
      
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
        console.warn('Firebase is not configured. Running in guest mode.');
        setLoading(false);
      }
    } catch (error) {
      console.warn('Firebase configuration check failed:', error);
      setFirebaseConfigured(false);
      setLoading(false);
    }
  }, [mounted]);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    isFirebaseConfigured: firebaseConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 