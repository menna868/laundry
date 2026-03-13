import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft, Minus, Plus, Clock, Calendar, MapPin, Check,
  AlertCircle, Loader2, Package, ChevronDown, Lock, RefreshCw
} from 'lucide-react';
import { laundries } from '../data/laundries';
import { saveOrder, Order } from '../data/sampleOrders';
import { useAuth } from '../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
function simulateServiceCheck(): Promise<boolean> {
  return new Promise(resolve => setTimeout(() => resolve(true), 1000));
}

const dates = ['Today', 'Tomorrow', 'Day After'];
const timeSlots = [
  '08:00 – 10:00', '10:00 – 12:00',
  '12:00 – 14:00', '14:00 – 16:00',
  '16:00 – 18:00', '18:00 – 20:00',
];

// ── Component ────────────────────────────────────────────────────────────────
export default function OrderPage() {
  const { laundryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const laundry = laundries.find(l => l.id === laundryId);
  const serviceId = searchParams.get('service') ?? '';
  const service = laundry?.services.find(s => s.id === serviceId);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/order/${laundryId}?service=${serviceId}` }, replace: true });
    }
  }, [isLoggedIn, navigate, laundryId, serviceId]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [itemCount, setItemCount]           = useState(1);
  const [selectedDate, setSelectedDate]     = useState('Today');
  const [selectedTime, setSelectedTime]     = useState('10:00 – 12:00');
  const [pickupAddress, setPickupAddress]   = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [sameAddress, setSameAddress]       = useState(true);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [validating, setValidating]         = useState(false);
  const [errors, setErrors]                 = useState<Record<string, string>>({});
  const [serviceError, setServiceError]     = useState(false);

  if (!laundry || !service) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-8 text-center">
        <div>
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <p className="text-gray-700 mb-2">Service not found</p>
          <button onClick={() => navigate(-1)} className="text-[#1D6076] text-sm underline">Go back</button>
        </div>
      </div>
    );
  }

  const deliveryFee = 10;
  const subtotal    = service.price * itemCount;
  const total       = subtotal + deliveryFee;
  const finalDelivery = sameAddress ? pickupAddress : deliveryAddress;

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!pickupAddress.trim())   e.pickup   = 'Pickup address is required';
    if (!sameAddress && !deliveryAddress.trim()) e.delivery = 'Delivery address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────��──────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setServiceError(false);
    if (!validate()) {
      // scroll to top of form to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidating(true);
    const available = await simulateServiceCheck();
    setValidating(false);

    if (!available) {
      setServiceError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Build pending order, navigate to payment
    const pendingOrder: Order = {
      id:              Date.now().toString(),
      userId:          user?.id,
      laundryId:       laundry.id,
      laundryName:     laundry.name,
      laundryImage:    laundry.image,
      serviceId:       service.id,
      serviceName:     service.name,
      servicePrice:    service.price,
      serviceUnit:     service.unit,
      itemCount,
      pickupDate:      selectedDate,
      pickupTime:      selectedTime,
      pickupAddress:   pickupAddress.trim(),
      deliveryAddress: finalDelivery.trim(),
      subtotal,
      deliveryFee,
      total,
      status:          'pending_confirmation',
      paymentStatus:   'pending',
      rating:          null,
      review:          null,
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    // Stash as pending
    localStorage.setItem('nadeef_pending_order', JSON.stringify(pendingOrder));
    navigate('/payment');
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-48" dir="ltr">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-[#1D6076] text-white px-4 md:px-8 py-4 shadow-sm">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} className="text-white" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-base">New Order</h1>
            <p className="text-white/70 text-xs truncate">{laundry.name} · {service.name}</p>
          </div>
        </div>
      </div>

      {/* Service unavailable banner */}
      {serviceError && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-red-700 text-sm font-medium">Service no longer available</p>
                <p className="text-red-600 text-xs mt-0.5">
                  The selected service is not available at this time. Please choose a different service.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/laundry/${laundryId}`)}
              className="mt-3 flex items-center gap-1.5 text-red-600 text-xs font-medium hover:underline"
            >
              <RefreshCw size={12} strokeWidth={2.5} />
              Choose a Different Service
            </button>
          </div>
        </div>
      )}

      {/* Validation error summary */}
      {Object.keys(errors).length > 0 && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2.5">
            <AlertCircle size={15} className="text-amber-500 shrink-0" strokeWidth={2} />
            <p className="text-amber-700 text-sm">All required fields must be filled before placing your order.</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-5 space-y-4">

        {/* ── Service info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">SELECTED SERVICE</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1D6076]/10 flex items-center justify-center shrink-0">
                <Package size={20} className="text-[#1D6076]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium">{service.name}</p>
                <p className="text-xs text-gray-400">{service.unit}</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-[#1D6076]">{service.price} EGP</p>
          </div>
          {serviceError && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2.5">
              <AlertCircle size={15} className="text-red-500 shrink-0" strokeWidth={2} />
              <p className="text-red-600 text-xs">Selected service is no longer available. Please go back and choose another.</p>
            </div>
          )}
        </div>

        {/* ── Items counter ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">NUMBER OF ITEMS</p>
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-6 py-4">
            <button
              onClick={() => setItemCount(Math.max(1, itemCount - 1))}
              className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
            >
              <Minus size={18} strokeWidth={2.5} className="text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-4xl text-[#1D6076]" style={{ fontWeight: 300 }}>{itemCount}</p>
              <p className="text-xs text-gray-400 mt-1">{service.unit.replace('per ', '')}{itemCount > 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setItemCount(itemCount + 1)}
              className="w-11 h-11 rounded-xl bg-[#1D6076] flex items-center justify-center hover:bg-[#2a7a94] active:scale-95 transition-all shadow-sm"
            >
              <Plus size={18} strokeWidth={2.5} className="text-white" />
            </button>
          </div>
        </div>

        {/* ── Pickup date ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[#EBA050]" strokeWidth={2} />
            <p className="text-xs font-semibold text-gray-400 tracking-wider">PICKUP DATE</p>
          </div>
          <div className="flex gap-2.5">
            {dates.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                  selectedDate === d
                    ? 'bg-[#1D6076] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* ── Pickup time ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#1D6076]" strokeWidth={2} />
            <p className="text-xs font-semibold text-gray-400 tracking-wider">PICKUP TIME</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {timeSlots.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] relative ${
                  selectedTime === t
                    ? 'bg-[#1D6076] text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {t}
                {selectedTime === t && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Pickup location ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-[#EBA050]" strokeWidth={2} />
            <p className="text-xs font-semibold text-gray-400 tracking-wider">PICKUP ADDRESS</p>
          </div>
          <input
            type="text"
            placeholder="Enter your pickup address…"
            value={pickupAddress}
            onChange={e => { setPickupAddress(e.target.value); setErrors(p => ({ ...p, pickup: '' })); }}
            className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
              errors.pickup
                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : 'border-gray-200 focus:ring-[#1D6076]/20 focus:border-[#1D6076]'
            }`}
          />
          {errors.pickup && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.pickup}</p>}

          {/* Same address toggle */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-sm text-gray-700">Deliver to same address</p>
              <p className="text-xs text-gray-400">Use pickup address as delivery address</p>
            </div>
            <button
              onClick={() => setSameAddress(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${sameAddress ? 'bg-[#1D6076]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${sameAddress ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* ── Delivery address (if different) ── */}
        {!sameAddress && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-[#1D6076]" strokeWidth={2} />
              <p className="text-xs font-semibold text-gray-400 tracking-wider">DELIVERY ADDRESS</p>
            </div>
            <input
              type="text"
              placeholder="Enter delivery address…"
              value={deliveryAddress}
              onChange={e => { setDeliveryAddress(e.target.value); setErrors(p => ({ ...p, delivery: '' })); }}
              className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                errors.delivery
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : 'border-gray-200 focus:ring-[#1D6076]/20 focus:border-[#1D6076]'
              }`}
            />
            {errors.delivery && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12} />{errors.delivery}</p>}
          </div>
        )}

        {/* Spacer */}
        <div className="h-2" />
      </div>

      {/* ── Sticky bottom summary + CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg px-4 md:px-8 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-500">{itemCount} × {service.price} EGP</span>
            <span className="text-gray-700 font-medium">{subtotal} EGP</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-500">Delivery fee</span>
            <span className="text-gray-700 font-medium">{deliveryFee} EGP</span>
          </div>
          <div className="flex items-center justify-between mb-4 pt-2 border-t border-gray-100">
            <span className="text-gray-900 font-medium">Total</span>
            <span className="text-xl font-semibold text-[#1D6076]">{total} EGP</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={validating}
            className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2a7a94] active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm"
          >
            {validating ? (
              <><Loader2 size={18} className="animate-spin" strokeWidth={2} /> Checking availability…</>
            ) : (
              <>Proceed to Payment <ChevronDown size={16} className="rotate-[-90deg]" strokeWidth={2} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}