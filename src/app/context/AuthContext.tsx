"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  ApiError,
  AuthResult,
  AuthUser,
  forgotPasswordRequest,
  googleLoginRequest,
  loginRequest,
  mapTokenToAuthUser,
  mapUserDtoToAuthUser,
  registerRequest,
  resetPasswordRequest,
  verifyEmailRequest,
} from "@/app/lib/api";

const STORAGE_KEY = "nadeef_user";
export type User = AuthUser;
const SHOULD_RESTORE_STORED_USER = process.env.NODE_ENV !== "development";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAuthReady: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: SignupData) => Promise<AuthResult>;
  verifyEmail: (email: string, otpCode: string) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (
    email: string,
    otpCode: string,
    newPassword: string,
  ) => Promise<AuthResult>;
  logout: () => void;
  socialLogin: (provider: string, credential?: string) => Promise<AuthResult>;
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

function normalizeFieldErrors(data: unknown) {
  if (!data || typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;
  const errors = record.errors;
  if (!errors || typeof errors !== "object") return undefined;

  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      normalized[key.toLowerCase()] = value[0];
    } else if (typeof value === "string") {
      normalized[key.toLowerCase()] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function readStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistUser(user: User | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function toAuthError(error: unknown): AuthResult {
  if (error instanceof ApiError) {
    const message =
      error.message === "Invalid Password."
        ? "Password is wrong."
        : error.message;

    return {
      ok: false,
      message,
      fieldErrors: normalizeFieldErrors(error.data),
    };
  }

  return { ok: false, message: "Something went wrong. Please try again." };
}

function getEmailPrefix(email: string) {
  return (
    email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))[0] || "Customer"
  );
}

function parseJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function enrichGoogleUser(user: User, credential?: string): User {
  const payload = credential ? parseJwtPayload(credential) : null;
  const emailFromToken =
    typeof payload?.email === "string" ? payload.email : undefined;
  const email = user.email || emailFromToken || "";
  const derivedFirstName = email ? getEmailPrefix(email) : "Google";

  return {
    ...user,
    email,
    firstName: user.firstName?.trim() || derivedFirstName,
    lastName: user.lastName?.trim() || "User",
    name:
      user.name?.trim() ||
      `${user.firstName?.trim() || derivedFirstName} ${user.lastName?.trim() || "User"}`.trim(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const storedUser = SHOULD_RESTORE_STORED_USER ? readStoredUser() : null;

    if (!SHOULD_RESTORE_STORED_USER) {
      persistUser(null);
    }

    setUser(storedUser);
    setIsAuthReady(true);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await loginRequest(email, password);
      const nextUser = mapUserDtoToAuthUser(response);

      setUser(nextUser);
      persistUser(nextUser);

      return { ok: true, user: nextUser };
    } catch (error) {
      setUser(null);
      persistUser(null);
      return toAuthError(error);
    }
  };

  const signup = async (data: SignupData): Promise<AuthResult> => {
    try {
      const response = await registerRequest({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
        phoneNumber: data.phone,
        role: "Customer",
      });

      if (response.token) {
        const nextUser = mapUserDtoToAuthUser(response);
        setUser(nextUser);
        persistUser(nextUser);
        return { ok: true, user: nextUser };
      }

      return {
        ok: true,
        requiresVerification: true,
        email: response.email,
        message: "We sent a verification code to your email.",
      };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const verifyEmail = async (
    email: string,
    otpCode: string,
  ): Promise<AuthResult> => {
    try {
      const response = await verifyEmailRequest(email, otpCode);
      const nextUser = mapTokenToAuthUser(response.token, { email });

      setUser(nextUser);
      persistUser(nextUser);

      return { ok: true, user: nextUser };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const socialLogin = async (
    provider: string,
    credential?: string,
  ): Promise<AuthResult> => {
    if (provider !== "google") {
      return {
        ok: false,
        message: `${provider} sign-in is not supported in this frontend.`,
      };
    }

    if (!credential) {
      return {
        ok: false,
        message: "Google sign-in did not return a valid credential.",
      };
    }

    try {
      const response = await googleLoginRequest(credential);
      const nextUser = enrichGoogleUser(mapUserDtoToAuthUser(response), credential);

      setUser(nextUser);
      persistUser(nextUser);

      return { ok: true, user: nextUser };
    } catch (error) {
      setUser(null);
      persistUser(null);
      return toAuthError(error);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    try {
      const response = await forgotPasswordRequest(email);
      return {
        ok: true,
        email,
        message: response.message,
      };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const resetPassword = async (
    email: string,
    otpCode: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    try {
      await resetPasswordRequest({
        email,
        otpCode,
        newPassword,
      });

      try {
        // Verify the backend actually accepts the new password before we
        // tell the UI the reset succeeded.
        await loginRequest(email, newPassword);
      } catch {
        setUser(null);
        persistUser(null);
        return {
          ok: false,
          message:
            "The backend reported success, but it still rejected the new password. Please request a new OTP and try again.",
        };
      }

      // Force a fresh sign-in after password reset so stale local auth
      // state cannot make it look like the old password still works.
      setUser(null);
      persistUser(null);

      return {
        ok: true,
        email,
        message: "Password has been reset successfully.",
      };
    } catch (error) {
      return toAuthError(error);
    }
  };

  const logout = () => {
    setUser(null);
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAuthReady,
        login,
        signup,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        socialLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
