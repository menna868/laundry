"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { emailLogin, googleLogin, register } from '../services/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  role?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (email: string, otpCode: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  socialLogin: (idToken: string) => Promise<boolean>;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('nadeef_user');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await emailLogin(email, password) as any;
      if (res.isSuccess && res.data) {
        const u = res.data;
        const loggedIn: User = {
          id: u.id || u.Id,
          firstName: u.name?.split(' ')[0] || u.Name?.split(' ')[0] || '',
          lastName: u.name?.split(' ').slice(1).join(' ') || u.Name?.split(' ').slice(1).join(' ') || '',
          email: u.email || u.Email,
          phone: u.phoneNumber || u.PhoneNumber || '',
          role: u.role || u.Role || 'Customer',
          token: u.token || u.Token
        };
        setUser(loggedIn);
        localStorage.setItem('nadeef_session', JSON.stringify({ token: loggedIn.token }));
        localStorage.setItem('nadeef_user', JSON.stringify(loggedIn));
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const signup = async (data: SignupData): Promise<{success: boolean, error?: string}> => {
    try {
      const res = await register({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        phoneNumber: data.phone
      }) as any;

      if (res.isSuccess) {
        // User is created but must verify email. Don't set token or log them in.
        return { success: true };
      }
      return { success: false, error: res.error || 'Signup failed' };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || 'Signup failed' };
    }
  };

  const verifyEmail = async (email: string, otpCode: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const { verifyOtp } = await import('../services/api');
      const res = await verifyOtp(email, otpCode);
      if (res.isSuccess && res.data) {
        const tokenObj: any = res.data;
        const actualToken = typeof tokenObj === 'string' ? tokenObj : (tokenObj.token || tokenObj.Token);

        if (!actualToken) {
          return { ok: false, message: 'No token received from verification' };
        }

        // Decode JWT to set user session
        let payload: any = {};
        try {
          payload = JSON.parse(atob(actualToken.split('.')[1]));
        } catch { }

        const userName = payload.Name || payload.name || 'User';
        const loggedIn: User = {
          id: payload.uid || payload.nameid || '',
          firstName: userName.split(' ')[0] || '',
          lastName: userName.split(' ').slice(1).join(' ') || '',
          email: payload.email || email,
          phone: '',
          role: payload.role || 'Customer',
          token: actualToken
        };
        setUser(loggedIn);
        localStorage.setItem('nadeef_session', JSON.stringify({ token: loggedIn.token }));
        localStorage.setItem('nadeef_user', JSON.stringify(loggedIn));
        return { ok: true };
      }
      return { ok: false, message: res.error || 'Verification failed' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Network error' };
    }
  };

  const socialLogin = async (idToken: string): Promise<boolean> => {
    try {
      const res = await googleLogin(idToken) as any;
      if (res.isSuccess && res.data) {
        const u = res.data;
        const loggedIn: User = {
          id: u.id || u.Id,
          firstName: u.name?.split(' ')[0] || u.Name?.split(' ')[0] || '',
          lastName: u.name?.split(' ').slice(1).join(' ') || u.Name?.split(' ').slice(1).join(' ') || '',
          email: u.email || u.Email,
          phone: u.phoneNumber || u.PhoneNumber || '',
          role: u.role || u.Role || 'Customer',
          token: u.token || u.Token
        };
        setUser(loggedIn);
        localStorage.setItem('nadeef_session', JSON.stringify({ token: loggedIn.token }));
        localStorage.setItem('nadeef_user', JSON.stringify(loggedIn));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Social login error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nadeef_user');
    localStorage.removeItem('nadeef_session');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, verifyEmail, logout, socialLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
