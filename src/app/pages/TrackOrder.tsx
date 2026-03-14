import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Star, AlertCircle, Loader2, MapPin,
  Clock, Package, CheckCircle2, XCircle, Truck, ShieldCheck, Sparkles, Lock
} from 'lucide-react';
import {
  Order, getOrder, statusConfig, statusOrder, OrderStatus
} from '../data/sampleOrders';
import { useAuth } from '../context/AuthContext';

// ── Flow states ───────────────────────────────────────────────────────────────
type FlowState = 'loading' | 'invalid' | 'not_found' | 'access_denied' | 'success';

// ── Status icon map ───────────────────────────────────────────────────────────
const StatusIcon: Record<OrderStatus, React.ElementType> = {
  pending_confirmation: Clock,
  accepted:            CheckCircle2,
  washing:             Sparkles,
  ready_for_pickup:    Package,
  picked_up:           Truck,
  delivered:           ShieldCheck,
  cancelled:           XCircle,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Timeline step ─────────────────────────────────────────────────────────────
function TimelineStep({
  status, currentStatus, isLast,
}: {
  status: OrderStatus;
  currentStatus: OrderStatus;
  isLast: boolean;
}) {
  const cfg = statusConfig[status];
  const Icon = StatusIcon[status];
  const currentIdx = statusOrder.indexOf(currentStatus);
  const stepIdx    = statusOrder.indexOf(status);
  const isDone     = stepIdx <= currentIdx && currentStatus !== 'cancelled';
  const isActive   = status === currentStatus && currentStatus !== 'cancelled';

  return (
    <div className="flex gap-3">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
            isActive ? 'ring-4 ring-offset-1' : ''
          }`}
          style={
            isDone || isActive
              ? { backgroundColor: cfg.bg, color: cfg.color, ...(isActive ? { ringColor: `${cfg.color}30` } : {}) }
              : { backgroundColor: '#f3f4f6', color: '#9ca3af' }
          }
        >
          <Icon size={15} strokeWidth={2} />
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-1 min-h-[28px]"
            style={{ backgroundColor: isDone && !isActive ? cfg.color : '#e5e7eb', opacity: isDone ? 0.35 : 1 }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
        <p
          className="text-sm font-medium mb-0.5"
          style={{ color: (isDone || isActive) ? cfg.color : '#9ca3af' }}
        >
          {cfg.label}
        </p>
        {isActive && (
          <p className="text-xs text-gray-500 leading-relaxed">{cfg.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrackOrder() {
  const { id }  = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [order, setOrder]         = useState<Order | null>(null);

  useEffect(() => {
    const run = async () => {
      setFlowState('loading');
      await new Promise(r => setTimeout(r, 900));

      // 1. Validate Order ID format
      if (!id || id.trim().length < 1 || !/^\d+$/.test(id)) {
        setFlowState('invalid');
        return;
      }

      // 2. Fetch order
      const found = getOrder(id);
      if (!found) { setFlowState('not_found'); return; }

      // 3. Ownership check — if order has a userId, it must match logged-in user
      if (found.userId && user && found.userId !== user.id) {
        setFlowState('access_denied');
        return;
      }

      setOrder(found);
      setFlowState('success');
    };
    run();
  }, [id, user]);

  const cfg = order ? statusConfig[order.status] : null;

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      {/* Header */}
      <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900 text-lg">Track Order</h1>
            {order && <p className="text-xs text-gray-400">Order #{order.id}</p>}
          </div>
        </div>
      </div>

      {/* Loading */}
      {flowState === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 size={30} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">Fetching order…</p>
        </div>
      )}

      {/* Invalid request */}
      {flowState === 'invalid' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <AlertCircle size={34} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">Invalid Request</h2>
          <p className="text-gray-500 text-sm mb-7 max-w-xs">The order ID is not valid. Please check the link and try again.</p>
          <Link href="/orders" className="bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] transition-all">
            My Orders
          </Link>
        </div>
      )}

      {/* Not found */}
      {flowState === 'not_found' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <AlertCircle size={34} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">Order Not Found</h2>
          <p className="text-gray-500 text-sm mb-7 max-w-xs">We couldn&apos;t find this order. It may have been removed or the link is outdated.</p>
          <Link href="/orders" className="bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] transition-all">
            My Orders
          </Link>
        </div>
      )}

      {/* Access denied */}
      {flowState === 'access_denied' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <Lock size={34} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-7">You don&apos;t have permission to view this order. It belongs to a different account.</p>
          <Link href="/orders" className="bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] transition-all">
            My Orders
          </Link>
        </div>
      )}

      {/* Success */}
      {flowState === 'success' && order && cfg && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-5 space-y-4 pb-10">

          {/* Status hero card */}
          <div
            className="rounded-2xl p-5 shadow-sm border"
            style={{ backgroundColor: cfg.bg, borderColor: `${cfg.color}20` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cfg.color}20` }}
              >
                {(() => { const I = StatusIcon[order.status]; return <I size={22} style={{ color: cfg.color }} strokeWidth={1.8} />; })()}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: cfg.color }}>
                  CURRENT STATUS
                </p>
                <h2 className="text-gray-900 text-lg">{cfg.label}</h2>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">{cfg.description}</p>
              </div>
            </div>

            {/* Last updated */}
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t" style={{ borderColor: `${cfg.color}20` }}>
              <Clock size={12} style={{ color: cfg.color }} strokeWidth={2} />
              <p className="text-xs" style={{ color: cfg.color }}>
                Last updated {timeAgo(order.updatedAt)} · {formatDate(order.updatedAt)}
              </p>
            </div>
          </div>

          {/* Order details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">ORDER DETAILS</p>
            <div className="space-y-3">
              {[
                { label: 'Laundry',   value: order.laundryName },
                { label: 'Service',   value: order.serviceName },
                { label: 'Items',     value: `${order.itemCount} ${order.serviceUnit}` },
                { label: 'Pickup',    value: `${order.pickupDate}, ${order.pickupTime}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm text-gray-900 font-medium">{value}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-sm font-semibold text-[#1D6076]">{order.total} EGP</span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">ADDRESSES</p>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#EBA050]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={13} className="text-[#EBA050]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pickup</p>
                  <p className="text-sm text-gray-900">{order.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#1D6076]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={13} className="text-[#1D6076]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Delivery</p>
                  <p className="text-sm text-gray-900">{order.deliveryAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {order.status !== 'cancelled' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">ORDER PROGRESS</p>
              <div>
                {statusOrder.map((s, i) => (
                  <TimelineStep
                    key={s}
                    status={s}
                    currentStatus={order.status}
                    isLast={i === statusOrder.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled */}
          {order.status === 'cancelled' && (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-5 flex items-center gap-3">
              <XCircle size={22} className="text-red-400 shrink-0" strokeWidth={1.5} />
              <p className="text-sm text-red-700">This order has been cancelled.</p>
            </div>
          )}

          {/* Rate button */}
          {order.status === 'delivered' && order.rating === null && (
            <Link href={`/rate-order/${order.id}`} className="block">
              <div className="bg-gradient-to-r from-[#EBA050] to-[#d4832a] rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md active:scale-[0.99] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Star size={20} className="text-white fill-white" strokeWidth={0} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Rate Your Experience</p>
                    <p className="text-white/75 text-xs">How was your order?</p>
                  </div>
                </div>
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-white/60" strokeWidth={1.5} />)}
                </div>
              </div>
            </Link>
          )}

          {/* Already rated */}
          {order.status === 'delivered' && order.rating !== null && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">YOUR RATING</p>
              <div className="flex items-center gap-1.5 mb-2">
                {[1,2,3,4,5].map(i => (
                  <Star
                    key={i}
                    size={20}
                    className={i <= (order.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                    strokeWidth={1.5}
                  />
                ))}
                <span className="text-sm text-gray-700 font-medium ml-1">{order.rating}/5</span>
              </div>
              {order.review && <p className="text-sm text-gray-600 italic">&quot;{order.review}&quot;</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}