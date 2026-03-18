import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  MapPin,
  Star,
  Clock,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Navigation,
  AlertCircle,
  WifiOff,
  RefreshCw,
  ChevronRight,
  Zap,
} from "lucide-react";
import { laundries, Laundry } from "../data/laundries";
import { useAuth } from "../context/AuthContext";

// ─── Flow States ────────────────────────────────────────────────────────────
type FlowState =
  | "permission_request" // ask user for location permission
  | "locating" // getting GPS coords
  | "location_error" // coordinates invalid / GPS failed
  | "fetching" // fetching laundries from "DB"
  | "no_laundries" // fetched but empty
  | "success"; // laundries ready to display

type SortOption = "distance" | "rating";
type FilterOption = "all" | "available";

// ─── Mock async helpers ──────────────────────────────────────────────────────
function simulateGetGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 90% success rate in simulation
      resolve(Math.random() > 0.1 ? { lat: 30.0444, lng: 31.2357 } : null);
    }, 1400);
  });
}

function simulateFetchLaundries(): Promise<Laundry[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // filter active only (status === 'active')
      const active = laundries.filter((l) => l.status === "active");
      resolve(active);
    }, 1200);
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PermissionScreen({
  onGrant,
  onDeny,
}: {
  onGrant: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6">
        <Navigation size={40} className="text-[#1D6076]" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl text-gray-900 mb-3">Find Laundries Near You</h2>
      <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-xs">
        Nadeef needs your location to show nearby laundries, distances, and
        real-time availability.
      </p>
      <button
        onClick={onGrant}
        className="w-full max-w-xs bg-[#1D6076] text-white py-4 rounded-2xl text-base font-medium mb-3 hover:bg-[#1D6076]/90 active:scale-[0.98] transition-all"
      >
        Allow Location Access
      </button>
      <button
        onClick={onDeny}
        className="w-full max-w-xs text-gray-500 py-3 rounded-2xl text-base hover:text-gray-700 transition-all"
      >
        Not Now
      </button>
    </div>
  );
}

function LocatingScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1D6076]/10 flex items-center justify-center mb-6 relative">
        <MapPin size={40} className="text-[#1D6076]" strokeWidth={1.5} />
        <span className="absolute inset-0 rounded-full border-2 border-[#1D6076]/30 animate-ping" />
      </div>
      <h2 className="text-xl text-gray-900 mb-2">Getting your location…</h2>
      <p className="text-gray-400 text-sm">This only takes a moment</p>
    </div>
  );
}

function FetchingScreen() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="w-24 h-24 rounded-full bg-[#EBA050]/10 flex items-center justify-center mb-6">
        <Search size={38} className="text-[#EBA050]" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-2">Finding nearby laundries…</h2>
      <p className="text-gray-400 text-sm">
        Fetching active services in your area
      </p>
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[#1D6076] opacity-60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({
  type,
  onRetry,
}: {
  type: "location_error" | "no_laundries" | "permission_denied";
  onRetry: () => void;
}) {
  const config = {
    location_error: {
      icon: WifiOff,
      title: "Unable to Detect Location",
      body: "We couldn't get your GPS coordinates. Please check your device settings and try again.",
      action: "Try Again",
    },
    no_laundries: {
      icon: AlertCircle,
      title: "No Nearby Laundries",
      body: "There are no active laundries available in your area right now. Try expanding your search radius.",
      action: "Refresh",
    },
    permission_denied: {
      icon: MapPin,
      title: "Location Access Denied",
      body: "Without your location we can't show nearby laundries. You can enable location in your device settings.",
      action: "Try Again",
    },
  };

  const { icon: Icon, title, body, action } = config[type];

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <Icon size={36} className="text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
        {body}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#1D6076]/90 active:scale-[0.98] transition-all"
      >
        <RefreshCw size={16} strokeWidth={2} />
        {action}
      </button>
    </div>
  );
}

function LaundryCard({ laundry, index }: { laundry: Laundry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.07,
      }}
    >
      <Link
        href={`/laundry/${laundry.id}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.99] transition-all duration-200"
      >
        <motion.div
          className="relative h-44 overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.img
            src={laundry.image}
            alt={laundry.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.4 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {/* Status badge */}
          {!laundry.isAvailable && (
            <div className="absolute top-3 left-3 bg-gray-800/80 text-white text-xs px-3 py-1 rounded-full">
              Currently Closed
            </div>
          )}
          {laundry.discount && laundry.isAvailable && (
            <motion.div
              className="absolute top-3 left-3 bg-[#EBA050] text-white text-xs px-3 py-1 rounded-full font-medium"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {laundry.discount}
            </motion.div>
          )}
          {laundry.featured && (
            <div className="absolute top-3 right-3 bg-[#1D6076] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <Zap size={10} fill="white" strokeWidth={0} />
              Featured
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-gray-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
            <MapPin size={10} className="text-[#1D6076]" strokeWidth={2.5} />
            {laundry.distanceLabel}
          </div>
        </motion.div>

        <div className="px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-gray-900 text-base font-medium leading-snug">
              {laundry.name}
            </h3>
            <ChevronRight
              size={18}
              className="text-gray-300 mt-0.5 shrink-0"
              strokeWidth={2}
            />
          </div>
          <p className="text-gray-400 text-xs mb-3">{laundry.address}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-gray-900">
                {laundry.rating}
              </span>
              <span className="text-xs text-gray-400">({laundry.reviews})</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} className="text-[#1D6076]" strokeWidth={2} />
              {laundry.deliveryTime}
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span
              className={`text-xs font-medium ${laundry.isAvailable ? "text-emerald-600" : "text-gray-400"}`}
            >
              {laundry.isAvailable ? "Open" : "Closed"}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NearbyLaundries() {
  const router = useRouter();
  const { isLoggedIn, isAuthReady } = useAuth();
  const [flowState, setFlowState] = useState<FlowState>("permission_request");
  const [errorType, setErrorType] = useState<
    "location_error" | "no_laundries" | "permission_denied"
  >("location_error");
  const [laundryList, setLaundryList] = useState<Laundry[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace("/login?from=/nearby");
    }
  }, [isAuthReady, isLoggedIn, router]);

  // ── Grant location → locate → fetch ─────────────────────────────────────
  const handleGrantPermission = async () => {
    if (!isLoggedIn) {
      router.push("/login?from=/nearby");
      return;
    }

    setFlowState("locating");

    const coords = await simulateGetGPS();
    if (!coords) {
      setErrorType("location_error");
      setFlowState("location_error");
      return;
    }

    setFlowState("fetching");

    const results = await simulateFetchLaundries();
    if (results.length === 0) {
      setErrorType("no_laundries");
      setFlowState("no_laundries");
      return;
    }

    setLaundryList(results);
    setFlowState("success");
  };

  const handleDenyPermission = () => {
    setErrorType("permission_denied");
    setFlowState("location_error");
  };

  const handleRetry = () => setFlowState("permission_request");

  // ── Derived: filter + sort ────────────────────────────────────────────────
  const displayList = laundryList
    .filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.address.toLowerCase().includes(search.toLowerCase());
      const matchesAvailability = filterBy === "all" || l.isAvailable;
      return matchesSearch && matchesAvailability;
    })
    .sort((a, b) =>
      sortBy === "distance" ? a.distance - b.distance : b.rating - a.rating,
    );

  const availableCount = laundryList.filter((l) => l.isAvailable).length;

  if (!isAuthReady || !isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col" dir="ltr">
      {/* ── Header ── */}
      <div className="bg-white px-4 md:px-8 py-4 flex items-center gap-3 border-b border-gray-100 sticky top-16 z-20 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-gray-900 text-lg">Nearby Laundries</h1>
          {flowState === "success" && (
            <p className="text-xs text-gray-400 mt-0.5">
              {availableCount} of {laundryList.length} open now
            </p>
          )}
        </div>
        {flowState === "success" && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`p-2 rounded-xl transition-all active:scale-95 ${showFilters ? "bg-[#1D6076]/10 text-[#1D6076]" : "hover:bg-gray-50 text-gray-600"}`}
          >
            <SlidersHorizontal size={20} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── Flow Screens ── */}
      {flowState === "permission_request" && (
        <PermissionScreen
          onGrant={handleGrantPermission}
          onDeny={handleDenyPermission}
        />
      )}
      {flowState === "locating" && <LocatingScreen />}
      {flowState === "fetching" && <FetchingScreen />}
      {(flowState === "location_error" || flowState === "no_laundries") && (
        <ErrorScreen type={errorType} onRetry={handleRetry} />
      )}

      {/* ── Success: Laundries List ── */}
      {flowState === "success" && (
        <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-5 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder="Search laundries or areas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1D6076] focus:ring-1 focus:ring-[#1D6076]/20 transition-all shadow-sm"
            />
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              {/* Sort */}
              <div>
                <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2.5">
                  SORT BY
                </p>
                <div className="flex gap-2">
                  {(["distance", "rating"] as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSortBy(opt)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        sortBy === opt
                          ? "bg-[#1D6076] text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {opt === "distance" ? "📍 Distance" : "⭐ Rating"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Availability */}
              <div>
                <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2.5">
                  AVAILABILITY
                </p>
                <div className="flex gap-2">
                  {(["all", "available"] as FilterOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFilterBy(opt)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        filterBy === opt
                          ? "bg-[#EBA050] text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {opt === "all" ? "All" : "Open Now"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Result count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {displayList.length} result{displayList.length !== 1 ? "s" : ""}
              {search ? ` for "${search}"` : ""}
            </p>
            <p className="text-xs text-gray-400">
              Sorted by {sortBy === "distance" ? "distance" : "rating"}
            </p>
          </div>

          {/* List or empty state */}
          {displayList.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Search size={26} className="text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-gray-500 text-base mb-1">No results found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {displayList.map((l, i) => (
                  <LaundryCard key={l.id} laundry={l} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
