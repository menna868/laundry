import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  ArrowLeft, CreditCard, Lock, Check, XCircle, Loader2,
  ShieldCheck, AlertCircle, ChevronRight, Receipt
} from 'lucide-react';
import { Order, saveOrder } from '../data/sampleOrders';

// ── Flow states ───────────────────────────────────────────────────────────────
type FlowState = 'invalid' | 'form' | 'processing' | 'success' | 'failed';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2);
  return d;
}

function simulatePayment(): Promise<boolean> {
  return new Promise(resolve => setTimeout(() => resolve(Math.random() > 0.15), 2200));
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SuccessScreen({ order, onDone }: { order: Order; onDone: () => void }) {
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
        Your order has been placed and the laundry has been notified.
      </p>
      <p className="text-[#1D6076] text-sm font-medium mb-8">Order #{order.id}</p>

      <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-4 mb-8 text-left space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Service</span>
          <span className="text-gray-900 font-medium">{order.serviceName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Pickup</span>
          <span className="text-gray-900 font-medium">{order.pickupDate}, {order.pickupTime}</span>
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
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Back to Home</Link>
    </div>
  );
}

function FailedScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <XCircle size={36} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-3">Payment Failed</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
        Your payment could not be processed. Please check your card details and try again.
      </p>
      <button
        onClick={onRetry}
        className="w-full max-w-xs bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] active:scale-[0.99] transition-all mb-3"
      >
        Try Again
      </button>
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Payment() {
  const navigate = useNavigate();

  const [flowState, setFlowState] = useState<FlowState>('form');
  const [order, setOrder]         = useState<Order | null>(null);

  // Card form fields
  const [cardName,   setCardName]   = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry,     setExpiry]     = useState('');
  const [cvv,        setCvv]        = useState('');
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  // Load pending order
  useEffect(() => {
    const raw = localStorage.getItem('nadeef_pending_order');
    if (!raw) { setFlowState('invalid'); return; }
    try {
      setOrder(JSON.parse(raw));
      setFlowState('form');
    } catch {
      setFlowState('invalid');
    }
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cardName.trim())             e.cardName   = 'Cardholder name is required';
    if (cardNumber.replace(/\s/g,'').length < 16) e.cardNumber = 'Enter a valid 16-digit card number';
    if (expiry.length < 5)            e.expiry     = 'Enter a valid expiry date';
    if (cvv.length < 3)               e.cvv        = 'Enter a valid CVV';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate() || !order) return;
    setFlowState('processing');

    const success = await simulatePayment();
    if (success) {
      const completedOrder: Order = {
        ...order,
        paymentStatus: 'paid',
        updatedAt: new Date().toISOString(),
      };
      saveOrder(completedOrder);
      localStorage.removeItem('nadeef_pending_order');
      setOrder(completedOrder);
      setFlowState('success');
    } else {
      setFlowState('failed');
    }
  };

  const handleRetry = () => {
    setErrors({});
    setFlowState('form');
  };

  const handleDone = () => {
    if (order) navigate(`/track-order/${order.id}`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      {/* Header */}
      {flowState !== 'success' && flowState !== 'failed' && (
        <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-20 shadow-sm">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              disabled={flowState === 'processing'}
            >
              <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900 text-lg">Secure Payment</h1>
              <div className="flex items-center gap-1">
                <Lock size={11} className="text-emerald-500" strokeWidth={2.5} />
                <p className="text-xs text-emerald-600">256-bit SSL encrypted</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Invalid ── */}
      {flowState === 'invalid' && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
          <AlertCircle size={36} className="text-red-400 mb-4" strokeWidth={1.5} />
          <p className="text-gray-700 mb-1">Invalid payment request</p>
          <p className="text-gray-400 text-sm mb-6">No order data found. Please start a new order.</p>
          <Link to="/nearby" className="text-[#1D6076] text-sm underline">Browse Laundries</Link>
        </div>
      )}

      {/* ── Processing ── */}
      {flowState === 'processing' && (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6">
            <Loader2 size={36} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-2">Processing Payment…</h2>
          <p className="text-gray-400 text-sm">Please don't close this page</p>
        </div>
      )}

      {/* ── Success ── */}
      {flowState === 'success' && order && (
        <SuccessScreen order={order} onDone={handleDone} />
      )}

      {/* ── Failed ── */}
      {flowState === 'failed' && <FailedScreen onRetry={handleRetry} />}

      {/* ── Payment Form ── */}
      {flowState === 'form' && order && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-5 space-y-4 pb-40">

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={15} className="text-[#EBA050]" strokeWidth={2} />
              <p className="text-xs font-semibold text-gray-400 tracking-wider">ORDER SUMMARY</p>
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
              {[
                [`${order.itemCount} item${order.itemCount > 1 ? 's' : ''} × ${order.servicePrice} EGP`, `${order.subtotal} EGP`],
                ['Delivery fee', `${order.deliveryFee} EGP`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-700 font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-900 font-medium">Total</span>
                <span className="text-[#1D6076] text-lg font-semibold">{order.total} EGP</span>
              </div>
            </div>
          </div>

          {/* Card form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={15} className="text-[#1D6076]" strokeWidth={2} />
              <p className="text-xs font-semibold text-gray-400 tracking-wider">CARD DETAILS</p>
            </div>

            {/* Cardholder name */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">Cardholder Name</label>
              <input
                type="text"
                placeholder="Name on card"
                value={cardName}
                onChange={e => { setCardName(e.target.value); setErrors(p => ({ ...p, cardName: '' })); }}
                className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                  errors.cardName ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20'
                }`}
              />
              {errors.cardName && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errors.cardName}</p>}
            </div>

            {/* Card number */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={e => { setCardNumber(formatCardNumber(e.target.value)); setErrors(p => ({ ...p, cardNumber: '' })); }}
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 pr-12 focus:outline-none focus:ring-1 transition-all ${
                    errors.cardNumber ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20'
                  }`}
                />
                <CreditCard size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
              </div>
              {errors.cardNumber && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errors.cardNumber}</p>}
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Expiry Date</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={e => { setExpiry(formatExpiry(e.target.value)); setErrors(p => ({ ...p, expiry: '' })); }}
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.expiry ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20'
                  }`}
                />
                {errors.expiry && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errors.expiry}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">CVV</label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="•••"
                    value={cvv}
                    onChange={e => { setCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrors(p => ({ ...p, cvv: '' })); }}
                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                      errors.cvv ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20'
                    }`}
                  />
                  <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                </div>
                {errors.cvv && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{errors.cvv}</p>}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 mt-4 bg-emerald-50 rounded-xl px-3 py-2.5">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" strokeWidth={2} />
              <p className="text-xs text-emerald-700">Your payment info is encrypted and never stored.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay button (fixed bottom) ── */}
      {flowState === 'form' && order && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg px-4 md:px-8 py-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handlePay}
              className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2a7a94] active:scale-[0.99] transition-all shadow-sm"
            >
              <Lock size={15} strokeWidth={2.5} />
              Pay {order.total} EGP Securely
            </button>
            <p className="text-center text-xs text-gray-400 mt-2.5">
              By paying, you agree to our <span className="underline cursor-pointer">Terms of Service</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}