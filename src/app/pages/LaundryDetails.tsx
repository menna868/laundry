import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Star, Clock, MapPin, ArrowLeft, Sparkles, Shield, Zap, CreditCard,
  AlertCircle, WifiOff, Package, RefreshCw, ChevronRight, Info, Lock
} from 'lucide-react';
import { laundries, Laundry, ServiceItem, categoryLabels, categoryOrder } from '../data/laundries';
import { useAuth } from '../context/AuthContext';

// ─── Flow states ──────────────────────────────────────────────────────────────
type FlowState =
  | 'loading'          // fetching laundry details from "DB"
  | 'not_found'        // laundry ID invalid / doesn't exist
  | 'unavailable'      // laundry exists but status !== 'active'
  | 'fetching_services'// fetching services & prices
  | 'no_services'      // laundry active but no services
  | 'success';         // all good, show services

// ─── Simulate async operations ───────────────────────────────────────────────
function simulateFetchLaundry(id: string): Promise<Laundry | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = laundries.find((l) => l.id === id) ?? null;
      resolve(found);
    }, 900);
  });
}

function simulateFetchServices(laundry: Laundry): Promise<ServiceItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // filter available services only
      const available = laundry.services.filter((s) => s.available);
      resolve(available);
    }, 800);
  });
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4 px-5 py-6">
      <div className="h-6 bg-gray-100 rounded-xl w-3/4" />
      <div className="h-4 bg-gray-100 rounded-xl w-1/2" />
      <div className="h-4 bg-gray-100 rounded-xl w-2/5" />
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Error screens ────────────────────────────────────────────────────────────
function ErrorScreen({
  type,
  onRetry,
}: {
  type: 'not_found' | 'unavailable' | 'no_services';
  onRetry: () => void;
}) {
  const config = {
    not_found: {
      icon: WifiOff,
      title: 'Laundry Not Found',
      body: 'This laundry doesn\'t exist or the link may be outdated. Please go back and try another.',
      action: null,
    },
    unavailable: {
      icon: AlertCircle,
      title: 'Currently Unavailable',
      body: 'This laundry is temporarily closed. Check back later or browse other nearby laundries.',
      action: 'Browse Nearby',
    },
    no_services: {
      icon: Package,
      title: 'No Services Available',
      body: 'This laundry hasn\'t listed any active services at this time. Please check back soon.',
      action: 'Refresh',
    },
  };

  const { icon: Icon, title, body, action } = config[type];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <Icon size={34} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-7 max-w-xs">{body}</p>
      {action && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#1D6076]/90 active:scale-[0.98] transition-all"
        >
          <RefreshCw size={15} strokeWidth={2} />
          {action}
        </button>
      )}
      <Link href="/nearby"
        className="mt-3 text-sm text-[#1D6076] underline underline-offset-2"
      >
        Back to Nearby Laundries
      </Link>
    </div>
  );
}

// ─── Service row ──────────────────────────────────────────────────────────────
function ServiceRow({ service, laundryId }: { service: ServiceItem; laundryId: string }) {
  const categoryColors: Record<string, string> = {
    wash: '#1D6076',
    iron: '#EBA050',
    dry_clean: '#2a7a94',
    specialty: '#8b5cf6',
  };
  const color = categoryColors[service.category] ?? '#1D6076';

  return (
    <Link href={`/order/${laundryId}?service=${service.id}`}
      className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-[#1D6076]/30 hover:shadow-sm active:scale-[0.99] transition-all duration-200 bg-white group"
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Sparkles size={20} style={{ color }} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-gray-900 text-sm font-medium">{service.name}</p>
          {service.turnaround && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock size={10} strokeWidth={2} className="text-gray-300" />
              Ready in {service.turnaround}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-base font-semibold" style={{ color }}>
            {service.price} <span className="text-xs font-medium">EGP</span>
          </p>
          <p className="text-xs text-gray-400">{service.unit}</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-[#1D6076] transition-colors" strokeWidth={2} />
      </div>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LaundryDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [laundry, setLaundry] = useState<Laundry | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const runFlow = async () => {
    setFlowState('loading');
    setLaundry(null);
    setServices([]);

    // Step 1 – validate & fetch laundry
    const found = await simulateFetchLaundry(id ?? '');
    if (!found) {
      setFlowState('not_found');
      return;
    }

    // Step 2 – check status
    if (found.status !== 'active') {
      setLaundry(found);
      setFlowState('unavailable');
      return;
    }

    setLaundry(found);

    // Step 3 – fetch services & prices
    setFlowState('fetching_services');
    const svcList = await simulateFetchServices(found);

    if (svcList.length === 0) {
      setFlowState('no_services');
      return;
    }

    setServices(svcList);
    setFlowState('success');
  };

  useEffect(() => {
    runFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Group services by category (sorted per categoryOrder) ─────────────────
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: services.filter((s) => s.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const features = [
    { icon: Zap,       text: 'Fast Delivery',   color: '#EBA050' },
    { icon: Shield,    text: 'Safe Products',   color: '#1D6076' },
    { icon: Package,   text: 'Order Tracking',  color: '#5a6c7d' },
    { icon: CreditCard,text: 'Secure Payment',  color: '#2a7a94' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className={`sticky top-16 z-20 bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center gap-3 shadow-sm`}
      >
        <button
          onClick={() => router.back()}
          className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-gray-900 text-lg truncate">
            {laundry ? laundry.name : 'Laundry Details'}
          </h1>
          {flowState === 'success' && (
            <p className="text-xs text-gray-400 mt-0.5">
              {services.length} service{services.length !== 1 ? 's' : ''} available
            </p>
          )}
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────────���── */}
      {(flowState === 'loading' || flowState === 'fetching_services') && (
        <div>
          {/* Skeleton image */}
          <div className="h-56 bg-gray-200 animate-pulse" />
          {/* Info skeleton */}
          <div className="bg-white rounded-t-3xl -mt-6 relative z-10 shadow-sm">
            <SkeletonLoader />
          </div>
          {flowState === 'fetching_services' && (
            <div className="px-5 pt-2 pb-1 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#1D6076] opacity-50 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">Fetching services & prices…</p>
            </div>
          )}
        </div>
      )}

      {/* ── Errors ─────────────────────────────────────────────────────────── */}
      {flowState === 'not_found'  && <ErrorScreen type="not_found"  onRetry={runFlow} />}
      {flowState === 'unavailable' && <ErrorScreen type="unavailable" onRetry={() => router.push('/nearby')} />}
      {flowState === 'no_services' && <ErrorScreen type="no_services" onRetry={runFlow} />}

      {/* ── Success ────────────────────────────────────────────────────────── */}
      {flowState === 'success' && laundry && (
        <div className="pb-10">
          {/* Hero image */}
          <div className="relative h-56">
            <img src={laundry.image} alt={laundry.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {laundry.discount && (
              <div className="absolute top-4 right-4 bg-[#EBA050] text-white text-sm px-4 py-1.5 rounded-xl font-medium shadow">
                {laundry.discount}
              </div>
            )}
          </div>

          {/* Info card */}
          <div className="bg-white rounded-t-3xl -mt-6 relative z-10 shadow-sm px-5 pt-5 pb-4">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl text-gray-900">{laundry.name}</h2>
              {!laundry.isAvailable && (
                <span className="text-xs text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <Info size={10} strokeWidth={2.5} />
                  Busy
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium text-gray-900">{laundry.rating}</span>
                <span className="text-xs text-gray-500">({laundry.reviews})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                <Clock size={13} className="text-[#1D6076]" strokeWidth={2} />
                <span className="text-xs font-medium text-gray-800">{laundry.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                <MapPin size={13} className="text-[#1D6076]" strokeWidth={2} />
                <span className="text-xs font-medium text-gray-800">{laundry.distanceLabel} away</span>
              </div>
            </div>

            <p className="text-xs text-gray-400">{laundry.address}</p>
          </div>

          {/* Services grouped by category */}
          <div className="max-w-2xl mx-auto px-4 md:px-8 mt-4 space-y-5">
            {grouped.map(({ category, label, items }) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 tracking-wider mb-3 uppercase">
                  {label}
                </p>
                <div className="space-y-2.5">
                  {items
                    .sort((a, b) => a.price - b.price)
                    .map((svc) => (
                      <ServiceRow key={svc.id} service={svc} laundryId={laundry.id} />
                    ))}
                </div>
              </div>
            ))}

            {/* Features */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-2">
              <p className="text-xs font-semibold text-gray-500 tracking-wider mb-4 uppercase">
                Why Nadeef
              </p>
              <div className="grid grid-cols-2 gap-3">
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 bg-gray-50 p-3.5 rounded-xl border border-gray-100"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${f.color}15` }}
                      >
                        <Icon size={17} style={{ color: f.color }} strokeWidth={2} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{f.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}