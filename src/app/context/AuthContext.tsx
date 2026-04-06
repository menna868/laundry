"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { emailLogin } from '../services/api';

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
  socialLogin: (provider: string) => Promise<boolean>;
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

// Demo user for testing
const DEMO_USER: User = {
  id: 'usr_001',
  firstName: 'Basel',
  lastName: 'Ahmed',
  email: 'basel@nadeef.app',
  phone: '+20 100 123 4567',
  address: '14 Tahrir Square, Cairo',
};

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
      const res = await emailLogin(email, password);
      if (res.isSuccess && res.data) {
        const u = res.data;
        const loggedIn: User = {
          id: u.id,
          firstName: u.name.split(' ')[0] || '',
          lastName: u.name.split(' ').slice(1).join(' ') || '',
          email: u.email,
          phone: u.phoneNumber || '',
          role: u.role || 'Customer',
          token: u.token
        };
        setUser(loggedIn);
        localStorage.setItem('nadeef_session', JSON.stringify({ token: u.token }));
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
    await new Promise(r => setTimeout(r, 1200));
    const newUser: User = {
      id: `usr_${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
    };
    setUser(newUser);
    localStorage.setItem('nadeef_user', JSON.stringify(newUser));
    return true;
  };

  const socialLogin = async (provider: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 900));
    const socialUser: User = {
      ...DEMO_USER,
      id: `usr_${provider}_${Date.now()}`,
    };
    setUser(socialUser);
    localStorage.setItem('nadeef_user', JSON.stringify(socialUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nadeef_user');
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
