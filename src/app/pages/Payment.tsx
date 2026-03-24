import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Check,
  XCircle,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Receipt,
  Smartphone,
  Banknote,
} from "lucide-react";
import {
  ApiError,
  UiOrder,
  getOrderByIdRequest,
  mapOrderDtoToUiOrder,
  processPaymentRequest,
  payWithCashRequest,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";

type FlowState = "loading" | "invalid" | "form" | "processing" | "success" | "failed";
type PaymentMethod = "card" | "mobile_wallet" | "cash";

function SuccessScreen({
  order,
  onDone,
}: {
  order: UiOrder;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
          <Check size={40} className="text-emerald-500" strokeWidth={2} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#1D6076] flex items-center justify-center shadow-md">
          <ShieldCheck size={16} className="text-white" strokeWidth={2} />
        </div>
      </div>
      <h2 className="text-2xl text-gray-900 mb-2">Payment Registered!</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-2 max-w-xs">
        Your cash on delivery order has been registered successfully.
      </p>
      <p className="text-[#1D6076] text-sm font-medium mb-8">Order #{order.id}</p>

      <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-4 mb-8 text-left space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Service</span>
          <span className="text-gray-900 font-medium">{order.serviceName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Pickup</span>
          <span className="text-gray-900 font-medium">
            {order.pickupDate}, {order.pickupTime}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm">
          <span className="text-gray-500">Total</span>
          <span className="text-[#1D6076] font-semibold">{order.total} EGP</span>
        </div>
      </div>

      <button
        onClick={onDone}
        className="w-full max-w-xs bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all mb-3"
      >
        Track My Order
      </button>
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        Back to Home
      </Link>
    </div>
  );
}

function FailedScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <XCircle size={36} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-3">Payment Failed</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-2 max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="w-full max-w-xs bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all mb-3 mt-6"
      >
        Try Again
      </button>
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        Cancel
      </Link>
    </div>
  );
}

const paymentMethods: {
  key: PaymentMethod;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "card",
    label: "Credit / Debit Card",
    sublabel: "Pay securely via Kashier",
    icon: <CreditCard size={20} className="text-[#1D6076]" strokeWidth={1.8} />,
  },
  {
    key: "mobile_wallet",
    label: "Mobile Wallet",
    sublabel: "Vodafone Cash, Fawry & more",
    icon: <Smartphone size={20} className="text-[#1D6076]" strokeWidth={1.8} />,
  },
  {
    key: "cash",
    label: "Cash on Delivery",
    sublabel: "Pay when your order arrives",
    icon: <Banknote size={20} className="text-[#1D6076]" strokeWidth={1.8} />,
  },
];

export default function Payment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthReady, isLoggedIn } = useAuth();
  const orderId = searchParams.get("orderId");

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [order, setOrder] = useState<UiOrder | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [failureMessage, setFailureMessage] = useState(
    "Your payment could not be processed. Please try again.",
  );

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace("/login?from=/payment");
    }
  }, [isAuthReady, isLoggedIn, router]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!user?.token || !orderId) {
        setFlowState("invalid");
        return;
      }

      try {
        setFlowState("loading");
        const response = await getOrderByIdRequest(user.token, orderId);
        const mapped = mapOrderDtoToUiOrder(response);
        setOrder(mapped);
        setFlowState(mapped.paymentStatus === "paid" ? "success" : "form");
      } catch {
        setFlowState("invalid");
      }
    };

    loadOrder();
  }, [orderId, user?.token]);

  const handlePay = async () => {
    if (!user?.token || !order) return;

    try {
      setFlowState("processing");

      if (selectedMethod === "cash") {
        // Cash on delivery — no redirect needed
        await payWithCashRequest(user.token, Number(order.id), Number(order.total));
        setFlowState("success");
        return;
      }

      // Card or Mobile Wallet → Kashier Hosted Page redirect
      const response = await processPaymentRequest(user.token, {
        orderId: Number(order.id),
        amount: Number(order.total),
        paymentMethod: selectedMethod === "card" ? "CreditCard" : "MobilePayment",
      });

      if (response && response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        console.error("Invalid payment response:", response);
        throw new Error(`No checkout URL returned. Response: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? `${error.message} (status: ${error.status})`
          : error instanceof Error
          ? error.message
          : "Your payment could not be initiated right now.";
      setFailureMessage(msg);
      setFlowState("failed");
    }
  };

  const handleRetry = () => {
    setFlowState("form");
  };

  const handleDone = () => {
    if (order) router.push(`/track-order/${order.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      {flowState !== "success" && flowState !== "failed" && (
        <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-20 shadow-sm">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              disabled={flowState === "processing"}
            >
              <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900 text-lg">Secure Payment</h1>
              <div className="flex items-center gap-1">
                <Lock size={11} className="text-emerald-500" strokeWidth={2.5} />
                <p className="text-xs text-emerald-600">Powered by Kashier</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {flowState === "loading" && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
          <Loader2 size={30} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">Loading order summary...</p>
        </div>
      )}

      {flowState === "invalid" && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
          <AlertCircle size={36} className="text-red-400 mb-4" strokeWidth={1.5} />
          <p className="text-gray-700 mb-1">Invalid payment request</p>
          <p className="text-gray-400 text-sm mb-6">
            No valid order was found for this payment screen.
          </p>
          <Link href="/nearby" className="text-[#1D6076] text-sm underline">
            Browse Laundries
          </Link>
        </div>
      )}

      {flowState === "processing" && (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6">
            <Loader2 size={36} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-2">Processing Payment...</h2>
          <p className="text-gray-400 text-sm">Please don&apos;t close this page</p>
        </div>
      )}

      {flowState === "success" && order && <SuccessScreen order={order} onDone={handleDone} />}
      {flowState === "failed" && (
        <FailedScreen message={failureMessage} onRetry={handleRetry} />
      )}

      {flowState === "form" && order && (
        <>
          <div className="max-w-2xl mx-auto px-4 md:px-8 py-5 space-y-4 pb-40">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Receipt size={15} className="text-[#EBA050]" strokeWidth={2} />
                <p className="text-xs font-semibold text-gray-400 tracking-wider">
                  ORDER SUMMARY
                </p>
              </div>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-[#1D6076]/10 flex items-center justify-center shrink-0">
                  <CreditCard size={18} className="text-[#1D6076]" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium">{order.serviceName}</p>
                  <p className="text-xs text-gray-400">{order.laundryName}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" strokeWidth={2} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {order.itemCount} {order.serviceUnit}
                  </span>
                  <span className="text-gray-700 font-medium">{order.total} EGP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pickup</span>
                  <span className="text-gray-700 font-medium">
                    {order.pickupDate}, {order.pickupTime}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-900 font-medium">Total</span>
                  <span className="text-[#1D6076] text-lg font-semibold">
                    {order.total} EGP
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">
                PAYMENT METHOD
              </p>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.key}
                    onClick={() => setSelectedMethod(method.key)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      selectedMethod === method.key
                        ? "border-[#1D6076] bg-[#1D6076]/5"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1D6076]/10 flex items-center justify-center shrink-0">
                      {method.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium">{method.label}</p>
                      <p className="text-xs text-gray-400">{method.sublabel}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        selectedMethod === method.key
                          ? "border-[#1D6076] bg-[#1D6076]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedMethod === method.key && (
                        <Check size={10} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kashier Security Badge (shown for card/mobile wallet) */}
            {selectedMethod !== "cash" && (
              <div className="flex items-center gap-2 justify-center bg-emerald-50 rounded-xl px-3 py-2.5">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" strokeWidth={2} />
                <p className="text-xs text-emerald-700">
                  You&apos;ll be redirected to Kashier&apos;s secure checkout page.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Pay Button */}
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg px-4 md:px-8 py-4">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handlePay}
                className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2a7a94] active:scale-[0.99] transition-all shadow-sm"
              >
                <Lock size={15} strokeWidth={2.5} />
                {selectedMethod === "cash"
                  ? `Confirm Cash Order — ${order.total} EGP`
                  : `Pay ${order.total} EGP Securely`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
