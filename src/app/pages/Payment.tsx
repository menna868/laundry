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
} from "lucide-react";
import {
  ApiError,
  UiOrder,
  getOrderByIdRequest,
  mapOrderDtoToUiOrder,
  processPaymentRequest,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";

type FlowState = "loading" | "invalid" | "form" | "processing" | "success" | "failed";

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

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
      <h2 className="text-2xl text-gray-900 mb-2">Payment Successful!</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-2 max-w-xs">
        Your payment was confirmed by the backend and your order is now active.
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
          <span className="text-gray-500">Total paid</span>
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

export default function Payment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthReady, isLoggedIn } = useAuth();
  const orderId = searchParams.get("orderId");

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [order, setOrder] = useState<UiOrder | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failureMessage, setFailureMessage] = useState(
    "Your payment could not be processed. Please check your card details and try again.",
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

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!cardName.trim()) nextErrors.cardName = "Cardholder name is required";
    if (cardNumber.replace(/\s/g, "").length < 16) {
      nextErrors.cardNumber = "Enter a valid 16-digit card number";
    }
    if (expiry.length < 5) nextErrors.expiry = "Enter a valid expiry date";
    if (cvv.length < 3) nextErrors.cvv = "Enter a valid CVV";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePay = async () => {
    if (!user?.token || !order || !validate()) return;

    try {
      setFlowState("processing");

      await processPaymentRequest(user.token, {
        orderId: Number(order.id),
        amount: Number(order.total),
        paymentMethod: "CreditCard",
      });

      const refreshed = await getOrderByIdRequest(user.token, order.id);
      setOrder(mapOrderDtoToUiOrder(refreshed));
      setFlowState("success");
    } catch (error) {
      setFailureMessage(
        error instanceof ApiError
          ? error.message
          : "Your payment could not be processed right now.",
      );
      setFlowState("failed");
    }
  };

  const handleRetry = () => {
    setErrors({});
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
                <p className="text-xs text-emerald-600">
                  Backend payment confirmation
                </p>
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
            No valid backend order was found for this payment screen.
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard size={15} className="text-[#1D6076]" strokeWidth={2} />
                <p className="text-xs font-semibold text-gray-400 tracking-wider">
                  CARD DETAILS
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="Name on card"
                  value={cardName}
                  onChange={(event) => {
                    setCardName(event.target.value);
                    setErrors((current) => ({ ...current, cardName: "" }));
                  }}
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.cardName
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                  }`}
                />
                {errors.cardName && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {errors.cardName}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1.5">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(event) => {
                      setCardNumber(formatCardNumber(event.target.value));
                      setErrors((current) => ({ ...current, cardNumber: "" }));
                    }}
                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 pr-12 focus:outline-none focus:ring-1 transition-all ${
                      errors.cardNumber
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                    }`}
                  />
                  <CreditCard
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    strokeWidth={1.5}
                  />
                </div>
                {errors.cardNumber && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {errors.cardNumber}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Expiry Date</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(event) => {
                      setExpiry(formatExpiry(event.target.value));
                      setErrors((current) => ({ ...current, expiry: "" }));
                    }}
                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                      errors.expiry
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                    }`}
                  />
                  {errors.expiry && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} />
                      {errors.expiry}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">CVV</label>
                  <div className="relative">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="***"
                      value={cvv}
                      onChange={(event) => {
                        setCvv(event.target.value.replace(/\D/g, "").slice(0, 4));
                        setErrors((current) => ({ ...current, cvv: "" }));
                      }}
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                        errors.cvv
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                      }`}
                    />
                    <Lock
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      strokeWidth={1.5}
                    />
                  </div>
                  {errors.cvv && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} />
                      {errors.cvv}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 bg-emerald-50 rounded-xl px-3 py-2.5">
                <ShieldCheck
                  size={14}
                  className="text-emerald-500 shrink-0"
                  strokeWidth={2}
                />
                <p className="text-xs text-emerald-700">
                  The backend only uses this screen to confirm the payment request.
                </p>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg px-4 md:px-8 py-4">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handlePay}
                className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2a7a94] active:scale-[0.99] transition-all shadow-sm"
              >
                <Lock size={15} strokeWidth={2.5} />
                Pay {order.total} EGP Securely
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
