import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { User, getMe, setAuthTokenGetter } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Every API call goes through this getter to attach a fresh Firebase ID
// token — see custom-fetch.ts. Registered once, outside the component, so
// it's active even for requests fired before the provider mounts.
setAuthTokenGetter(() => auth.currentUser?.getIdToken() ?? null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // The backend verifies the ID token and returns this account's
        // SCRB profile (role, district, badge number).
        const profile = await getMe();
        setUser(profile);
      } catch {
        // Signed in with Firebase but not a provisioned SCRB account.
        setUser(null);
        await firebaseSignOut(auth);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged above picks up the new session and loads the profile.
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
