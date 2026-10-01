import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '@/lib/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<{ error: string | null; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  adminSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const signUp: AuthContextValue['signUp'] = async (name, email, password, phone) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password, phone });
      return { error: null, message: data.message };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return { error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const _handleLoginResponse = (data: { token: string; user: UserProfile }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      _handleLoginResponse(data);
      return { error: null };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return { error: error.response?.data?.message || 'Login failed' };
    }
  };

  const adminSignIn: AuthContextValue['adminSignIn'] = async (email, password) => {
    try {
      const { data } = await api.post('/auth/admin-login', { email, password });
      _handleLoginResponse(data);
      return { error: null };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return { error: error.response?.data?.message || 'Admin login failed' };
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      return { error: null };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return { error: error.response?.data?.message || 'Failed to send reset email' };
    }
  };

  const refreshProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin: user?.role === 'admin', signUp, signIn, adminSignIn, signOut, resetPassword, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
