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
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  socialLogin: (idToken: string) => Promise<boolean>;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
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

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      const res = await register({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        phoneNumber: data.phone
      }) as any;

      if (res.isSuccess && res.data) {
        const u = res.data;
        const loggedIn: User = {
          id: u.id || u.Id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          token: u.token || u.Token,
          role: u.role || u.Role || 'Customer'
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
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, logout, socialLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
