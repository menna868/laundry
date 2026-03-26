import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Shield,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { useAuth } from "../context/AuthContext";
import { changePasswordRequest } from "../lib/api";

function InfoRow({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1D6076] shadow-sm">
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wider text-gray-400">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm ${
              muted ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user, isAuthReady, isLoggedIn } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace("/login?from=/profile");
    }
  }, [isAuthReady, isLoggedIn, router]);

  const accountStatus = useMemo(() => {
    if (!user?.token) {
      return {
        label: "Session unavailable",
        tone: "text-amber-700 bg-amber-50 border-amber-200",
        icon: AlertCircle,
      };
    }

    return {
      label: "Connected to backend",
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
      icon: CheckCircle2,
    };
  }, [user?.token]);

  const handleChangePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (!user?.token) {
      toast.error("You must be logged in to change your password.");
      throw new Error("Not logged in.");
    }

    try {
      setPasswordBusy(true);
      await changePasswordRequest(user.token, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success("Password updated successfully.");
    } finally {
      setPasswordBusy(false);
    }
  };

  if (!isAuthReady || !isLoggedIn || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="text-center">
          <p className="text-sm text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const StatusIcon = accountStatus.icon;

  return (
    <div className="min-h-screen bg-white" dir="ltr">
      <div className="sticky top-16 z-10 border-b border-gray-200 bg-white px-4 py-4 md:px-8 lg:px-12">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={() => router.back()}
            className="rounded-xl p-1 transition-opacity hover:opacity-70"
          >
            <ArrowLeft size={24} className="text-gray-900" strokeWidth={2} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-xs font-bold tracking-wider text-gray-900">
            PROFILE
          </h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8 lg:px-12">
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#0d3d50] via-[#1D6076] to-[#2a7a94] p-6 text-white shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
              <UserRound size={28} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-[0.24em] text-white/70">
                CUSTOMER ACCOUNT
              </p>
              <h2 className="mt-2 truncate text-2xl font-semibold">{user.name}</h2>
              <p className="mt-1 text-sm text-white/80">{user.email}</p>
            </div>
          </div>

          <div
            className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${accountStatus.tone}`}
          >
            <StatusIcon size={14} strokeWidth={2} />
            {accountStatus.label}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-900">
            ACCOUNT DETAILS
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <InfoRow icon={UserRound} label="First name" value={user.firstName || "Not available"} muted={!user.firstName} />
            <InfoRow icon={UserRound} label="Last name" value={user.lastName || "Not available"} muted={!user.lastName} />
            <InfoRow icon={Mail} label="Email" value={user.email || "Not available"} muted={!user.email} />
            <InfoRow icon={Phone} label="Phone number" value={user.phone || "Not available from backend"} muted={!user.phone} />
            <InfoRow icon={Shield} label="Role" value={user.role || "Customer"} muted={!user.role} />
            <InfoRow icon={Lock} label="Token status" value={user.token ? "Authenticated session active" : "No active token"} muted={!user.token} />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-900">
            BACKEND SUPPORT
          </h2>
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-sm font-medium text-gray-900">Supported right now</p>
              <p className="mt-1 text-sm text-gray-500">
                Password changes are connected to the backend through
                <span className="font-medium text-gray-700"> `PUT /User/change-password`</span>.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
              <div className="flex items-start gap-2">
                <XCircle size={16} className="mt-0.5 text-amber-500" strokeWidth={2} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Missing backend endpoints</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Profile update, address persistence, and account deletion are not exposed in the current frontend API layer, so this page shows live backend-backed account data without fake save actions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-bold tracking-wider text-gray-900">
            ACCOUNT HELP
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowChangePassword(true)}
              disabled={passwordBusy || !user.token}
              className="w-full rounded-2xl border border-[#1D6076]/15 bg-[#1D6076]/5 px-4 py-4 text-left transition-all hover:bg-[#1D6076]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="text-sm font-medium text-[#1D6076]">Change password</p>
              <p className="mt-1 text-xs text-gray-500">
                Connected to the backend password endpoint.
              </p>
            </button>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-medium text-amber-800">
                Request account deletion
              </p>
              <p className="mt-1 text-xs text-amber-700">
                This action is not connected yet because no account-deletion backend API is currently available in the app.
              </p>
            </div>
          </div>
        </div>

        <div className="h-20" />
      </div>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}
