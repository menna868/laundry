"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Enter a valid email";
    }

    if (!otpCode.trim()) {
      nextErrors.otpCode = "OTP code is required";
    }

    if (newPassword.length < 6) {
      nextErrors.newPassword = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);
    const result = await resetPassword(
      email.trim(),
      otpCode.trim(),
      newPassword,
    );
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Password reset failed.");
      return;
    }

    router.replace(
      `/login?email=${encodeURIComponent(email.trim())}&reset=success`,
    );
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() =>
            router.push(
              `/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`,
            )
          }
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-8 transition-colors group"
        >
          <ArrowLeft
            size={16}
            strokeWidth={2}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back
        </button>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1D6076]/10 flex items-center justify-center mb-5">
            <ShieldCheck size={24} className="text-[#1D6076]" strokeWidth={2} />
          </div>

          <h1
            className="text-3xl text-gray-900 mb-2"
            style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Reset your password
          </h1>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Enter the OTP code you received and choose a new password for your
            account.
          </p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
              <AlertCircle
                size={16}
                className="text-red-500 shrink-0"
                strokeWidth={2}
              />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((previous) => ({ ...previous, email: "" }));
                  }}
                  className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pl-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.email
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                  }`}
                />
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                OTP code
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter the 6-digit code"
                  value={otpCode}
                  onChange={(event) => {
                    setOtpCode(event.target.value);
                    setErrors((previous) => ({ ...previous, otpCode: "" }));
                  }}
                  className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pl-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.otpCode
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                  }`}
                />
                <KeyRound
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
              </div>
              {errors.otpCode && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {errors.otpCode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setErrors((previous) => ({
                      ...previous,
                      newPassword: "",
                    }));
                  }}
                  className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pl-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.newPassword
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                  }`}
                />
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {errors.newPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2a7a94] active:scale-[0.99] transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                  Resetting password...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} strokeWidth={2} />
                  Reset password
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-5 leading-relaxed">
            Need a new code?{" "}
            <Link
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
              className="text-[#1D6076] hover:underline"
            >
              Send another one
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
