"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { type AuthUser, useAuth } from "../context/AuthContext";

const API_BASE_STORAGE_KEY = "nadeef_admin_api_base_url";

function getBridgeTarget(role: string) {
  return role === "LaundryAdmin" ? "/laundry-admin" : "/admin";
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isReady, login, acceptExternalSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTarget = searchParams.get("redirectTo") || "/admin";

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");
    const redirectTo = searchParams.get("redirectTo");
    const apiBaseUrl = searchParams.get("apiBaseUrl");

    if (apiBaseUrl) {
      window.localStorage.setItem(API_BASE_STORAGE_KEY, apiBaseUrl);
    }

    if (!token || !role || (role !== "SuperAdmin" && role !== "LaundryAdmin")) {
      return;
    }

    const bridgedUser: AuthUser = {
      id: searchParams.get("id") || "",
      name: searchParams.get("name") || "Admin User",
      email: searchParams.get("email") || "",
      phoneNumber: searchParams.get("phoneNumber") || "",
      role,
      token,
    };

    acceptExternalSession(bridgedUser);
    router.replace(redirectTo || getBridgeTarget(role));
  }, [acceptExternalSession, router, searchParams]);

  useEffect(() => {
    if (isReady && isLoggedIn) {
      router.replace(redirectTarget);
    }
  }, [isLoggedIn, isReady, redirectTarget, router]);

  if (isReady && isLoggedIn) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace(redirectTarget);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(29,96,118,0.18),_transparent_38%),linear-gradient(160deg,#f7fafb_0%,#edf4f7_55%,#fff6ea_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-[linear-gradient(160deg,#103b4a_0%,#1d6076_52%,#eba050_130%)] p-10 text-white xl:flex xl:flex-col xl:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                Ndeef Admin
              </span>
              <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">
                Manage laundries and users with live backend data.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/75">
                Sign in with a <code>SuperAdmin</code> account to review laundries, activate or suspend accounts, and monitor the platform from one dashboard.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Laundries</p>
                <p className="mt-2 text-2xl font-bold">Live</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Users</p>
                <p className="mt-2 text-2xl font-bold">Managed</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Actions</p>
                <p className="mt-2 text-2xl font-bold">Protected</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#1D6076]">Super Admin Login</p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Use the same credentials your backend accepts at <code>POST /api/auth/login</code>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#1D6076] focus-within:bg-white">
                    <Mail size={18} className="text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="admin@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#1D6076] focus-within:bg-white">
                    <LockKeyhole size={18} className="text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </label>

                {error ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1D6076] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1D6076]/20 transition hover:bg-[#164a5c] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
                  {isSubmitting ? "Signing in..." : "Sign in to dashboard"}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
                If your backend is running on a different host, set <code>NEXT_PUBLIC_API_BASE_URL</code> before starting the frontend.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
