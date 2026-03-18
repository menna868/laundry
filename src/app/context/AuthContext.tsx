"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAuthReady: boolean;
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
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('nadeef_user');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
    setIsAuthReady(true);
  }, []);

  const login = async (email: string, _password: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1100));
    // Accept any email/password for demo; or match demo user
    const loggedIn: User = email === DEMO_USER.email
      ? DEMO_USER
      : { ...DEMO_USER, email, id: `usr_${Date.now()}` };
    setUser(loggedIn);
    localStorage.setItem('nadeef_user', JSON.stringify(loggedIn));
    return true;
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
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAuthReady, login, signup, logout, socialLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
