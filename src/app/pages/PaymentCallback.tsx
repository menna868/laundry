import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, XCircle, Loader2, ShieldCheck } from "lucide-react";

type CallbackState = "loading" | "success" | "failed";

export default function PaymentCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>("loading");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    const merchantOrderId = searchParams.get("merchantOrderId") ?? "";

    // Extract order ID from merchantOrderId like "order-42-ticks" or "wallet-charge-uid-ticks"
    let extractedOrderId: string | null = null;
    if (merchantOrderId.startsWith("order-")) {
      extractedOrderId = merchantOrderId.split("-")[1] ?? null;
    }
    setOrderId(extractedOrderId);

    if (status === "success") {
      setState("success");
    } else {
      setState("failed");
    }
  }, [searchParams]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 size={30} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
        <p className="text-gray-400 text-sm">Verifying payment...</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
            <Check size={40} className="text-emerald-500" strokeWidth={2} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#1D6076] flex items-center justify-center shadow-md">
            <ShieldCheck size={16} className="text-white" strokeWidth={2} />
          </div>
        </div>
        <h2 className="text-2xl text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">
          Your payment was confirmed. Your order is now being processed.
        </p>
        {orderId && (
          <p className="text-[#1D6076] text-sm font-medium mb-8">Order #{orderId}</p>
        )}
        <div className="w-full max-w-xs space-y-3">
          {orderId ? (
            <button
              onClick={() => router.push(`/track-order/${orderId}`)}
              className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all"
            >
              Track My Order
            </button>
          ) : (
            <button
              onClick={() => router.push("/billing")}
              className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all"
            >
              Back to Billing
            </button>
          )}
          <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700 text-center">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <XCircle size={36} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-3">Payment Failed</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">
        Your payment could not be completed. Please try again.
      </p>
      <div className="w-full max-w-xs space-y-3">
        {orderId ? (
          <button
            onClick={() => router.push(`/payment?orderId=${orderId}`)}
            className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all"
          >
            Try Again
          </button>
        ) : (
          <button
            onClick={() => router.push("/billing")}
            className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all"
          >
            Back to Billing
          </button>
        )}
        <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700 text-center">
          Cancel
        </Link>
      </div>
    </div>
  );
}
