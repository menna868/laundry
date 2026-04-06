import { motion } from "motion/react";
import { useState } from "react";
import {
  Bell, ShieldAlert, Store, Users, DollarSign, CheckCircle,
  Filter, Trash2, Check, Clock
} from "lucide-react";
import clsx from "clsx";

const notifications = [
  { id: 1, type: "fraud", title: "Critical Fraud Alert", desc: "Suspicious payment pattern detected on order #4421 — multiple cards used from same device", time: "5 min ago", read: false, icon: ShieldAlert, color: "bg-red-50 text-red-600" },
  { id: 2, type: "laundry", title: "New Laundry Application", desc: "Quick Clean Hub from Riyadh submitted onboarding application — requires document verification", time: "32 min ago", read: false, icon: Store, color: "bg-[#1D6076]/10 text-[#1D6076]" },
  { id: 3, type: "revenue", title: "Revenue Milestone Reached", desc: "Platform monthly revenue exceeded SAR 150K for the first time — 22% above target", time: "1 hour ago", read: false, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
  { id: 4, type: "user", title: "Unusual Signup Spike", desc: "142 new signups in the last hour from Jeddah area — 300% above normal rate", time: "2 hours ago", read: true, icon: Users, color: "bg-amber-50 text-amber-600" },
  { id: 5, type: "laundry", title: "Laundry Suspension Auto-triggered", desc: "Modern Laundry suspended due to 5+ complaints in 24h — customer satisfaction below threshold", time: "3 hours ago", read: true, icon: Store, color: "bg-red-50 text-red-600" },
  { id: 6, type: "system", title: "System Health Check", desc: "All services running normally. API response time: 124ms avg. Uptime: 99.97%", time: "4 hours ago", read: true, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
  { id: 7, type: "revenue", title: "Commission Payout Completed", desc: "SAR 42,500 successfully transferred to 28 partner laundries", time: "6 hours ago", read: true, icon: DollarSign, color: "bg-[#EBA050]/10 text-[#EBA050]" },
  { id: 8, type: "fraud", title: "Promo Code Abuse Detected", desc: "Same promotional code NDEEF50 used 15 times from related IP addresses", time: "8 hours ago", read: true, icon: ShieldAlert, color: "bg-orange-50 text-orange-600" },
];

export function AdminNotifications() {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState(notifications);

  const filtered = items.filter((n) => filter === "all" || (filter === "unread" && !n.read) || n.type === filter);
  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems(items.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setItems(items.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <button onClick={markAllRead} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50">
          <Check size={14} /> Mark All Read
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "fraud", label: "Fraud" },
          { key: "laundry", label: "Laundry" },
          { key: "revenue", label: "Revenue" },
          { key: "user", label: "Users" },
          { key: "system", label: "System" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={clsx("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", filter === f.key ? "bg-[#1D6076] text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.map((n) => (
          <motion.div
            key={n.id}
            layout
            onClick={() => markRead(n.id)}
            className={clsx(
              "bg-white rounded-xl p-4 border transition-all cursor-pointer hover:shadow-sm group",
              n.read ? "border-slate-100" : "border-[#1D6076]/20 bg-[#1D6076]/[0.02]"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", n.color)}>
                <n.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] font-semibold text-slate-800">{n.title}</h4>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#1D6076] shrink-0" />}
                </div>
                <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{n.desc}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                  <Clock size={10} />
                  <span>{n.time}</span>
                </div>
              </div>
              <button className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
