import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getMe, setAuthTokenGetter } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { DEMO_PASSWORD } from '@/lib/demo-users';
import { profileForEmail } from '@/local-api/demo-profiles';

setAuthTokenGetter(() => {
  return localStorage.getItem('scrb_auth_token');
});

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const usesLocalApi = import.meta.env.VITE_API_MODE !== 'server';

function createLocalDemoSession(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const profile = profileForEmail(normalizedEmail);

  if (!profile || password !== DEMO_PASSWORD) {
    throw new Error('Invalid email or password');
  }

  const id = `usr-${profile.role}`;
  const payload = btoa(JSON.stringify({ userId: id, email: normalizedEmail }));
  const token = `demo.${payload}.local`;
  const user = {
    id,
    name: profile.name,
    role: profile.role,
    district: profile.district,
    badgeNumber: profile.badgeNumber,
  } as User;

  return { token, user };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('scrb_auth_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getMe();
        setUser(profile);
      } catch {
        localStorage.removeItem('scrb_auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    if (usesLocalApi) {
      const data = createLocalDemoSession(email, password);
      localStorage.setItem('scrb_auth_token', data.token);
      setUser(data.user);
      setLocation('/dashboard');
      return;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Invalid email or password');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('scrb_auth_token', data.token);
    }
    if (data.user) {
      setUser(data.user);
    } else {
      const profile = await getMe();
      setUser(profile);
    }
    setLocation('/dashboard');
  };

  const logout = async () => {
    if (!usesLocalApi) {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    localStorage.removeItem('scrb_auth_token');
    setUser(null);
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
