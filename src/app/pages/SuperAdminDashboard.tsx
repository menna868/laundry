import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Store,
  Users,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import { apiRequest } from "../lib/admin-api";
import type { LaundryRecord, UserRecord } from "../types/admin";

// ---------------------------------------------
// MOCK DATA FOR CHARTS (Mirroring Figma exactly)
// ---------------------------------------------
const revenueData = [
  { name: "Jan", revenue: 85, profit: 45 },
  { name: "Feb", revenue: 95, profit: 55 },
  { name: "Mar", revenue: 110, profit: 60 },
  { name: "Apr", revenue: 90, profit: 50 },
  { name: "May", revenue: 125, profit: 70 },
  { name: "Jun", revenue: 142.5, profit: 85 },
];

const orderStatusData = [
  { name: "Completed", value: 62, color: "#10B981" },
  { name: "In Progress", value: 18, color: "#3B82F6" },
  { name: "Pending", value: 12, color: "#F59E0B" },
  { name: "Cancelled", value: 8, color: "#EF4444" },
];

const cityData = [
  { name: "Riyadh", value: 38, color: "#2A5C66" },
  { name: "Jeddah", value: 24, color: "#3B82F6" },
  { name: "Dammam", value: 15, color: "#10B981" },
  { name: "Mecca", value: 12, color: "#F59E0B" },
  { name: "Medina", value: 11, color: "#8B5CF6" },
];

const hourlyData = [
  { time: "8am", orders: 40 },
  { time: "10am", orders: 120 },
  { time: "12pm", orders: 200 },
  { time: "2pm", orders: 180 },
  { time: "4pm", orders: 250 },
  { time: "6pm", orders: 380 },
  { time: "8pm", orders: 220 },
  { time: "10pm", orders: 90 },
];

const topLaundries = [
  { id: 1, name: "Al Jawhara Laundry", city: "Riyadh", orders: "1,240", rev: "SAR 38.2K" },
  { id: 2, name: "Clean & Care", city: "Jeddah", orders: "980", rev: "SAR 29.4K" },
  { id: 3, name: "Speed Wash Pro", city: "Dammam", orders: "856", rev: "SAR 25.1K" },
  { id: 4, name: "Modern Laundry", city: "Riyadh", orders: "742", rev: "SAR 22.8K" },
  { id: 5, name: "Royal Cleaners", city: "Mecca", orders: "695", rev: "SAR 20.1K" },
];

const recentOrdersList = [
  { id: "#ND-4521", customer: "Omar K.", laundry: "Al Jawhara Laundry", amount: "SAR 45", time: "12 mins ago", status: "Completed" },
  { id: "#ND-4520", customer: "Sara M.", laundry: "Clean & Care", amount: "SAR 120", time: "28 mins ago", status: "In Progress" },
  { id: "#ND-4519", customer: "Fahad A.", laundry: "Speed Wash Pro", amount: "SAR 85", time: "1 hour ago", status: "Pending" },
  { id: "#ND-4518", customer: "Noura S.", laundry: "Modern Laundry", amount: "SAR 65", time: "2 hours ago", status: "Cancelled" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "Completed":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold"><CheckCircle2 size={12} /> Completed</span>;
    case "In Progress":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold"><Clock size={12} /> In Progress</span>;
    case "Pending":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-semibold"><AlertCircle size={12} /> Pending</span>;
    case "Cancelled":
      return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold"><XCircle size={12} /> Cancelled</span>;
    default:
      return null;
  }
}

export function SuperAdminDashboard() {
  const [laundries, setLaundries] = useState<LaundryRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const [laundriesResponse, usersResponse] = await Promise.all([
          apiRequest<LaundryRecord[]>("/admin/laundries"),
          apiRequest<UserRecord[]>("/admin/users"),
        ]);
        if (!isMounted) return;
        setLaundries(laundriesResponse);
        setUsers(usersResponse);
      } catch (err) {
        console.error("Dashboard hook failed", err);
      }
    }
    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Dashboard Overview</h1>
          <p className="text-[13px] text-slate-500 mt-1">Real-time performance metrics and system health.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-slate-200 text-slate-700 text-[13px] rounded-xl px-4 py-2 outline-none focus:border-[#2A5C66] focus:ring-1 focus:ring-[#2A5C66]">
             <option>Last 30 Days</option>
             <option>Last 7 Days</option>
             <option>This Year</option>
          </select>
          <button className="bg-[#2A5C66] hover:bg-[#2A5C66]/90 text-white text-[13px] font-semibold rounded-xl px-5 py-2 shadow-sm transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* 4 Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} /> +12.5%
            </span>
          </div>
          <p className="text-slate-500 text-[13px] font-medium">Total Revenue</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">SAR 142.5K</h3>
        </div>

        {/* Laundries */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#2A5C66]/10 text-[#2A5C66] flex items-center justify-center">
              <Store size={20} />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} /> +4
            </span>
          </div>
          <p className="text-slate-500 text-[13px] font-medium">Active Laundries</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{laundries.length || 342}</h3>
        </div>

        {/* Users */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} /> +24%
            </span>
          </div>
          <p className="text-slate-500 text-[13px] font-medium">Total Users</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{users.length || "12,847"}</h3>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Package size={20} />
            </div>
            <span className="flex items-center gap-1 text-[12px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
              <TrendingDown size={14} /> -2.1%
            </span>
          </div>
          <p className="text-slate-500 text-[13px] font-medium">Orders Today</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">1,847</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Line Chart */}
        <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Revenue & Profit Overview</h2>
              <p className="text-xs text-slate-400 mt-1">Monthly tracking across all partner laundries</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#2A5C66]" /><span className="text-xs font-semibold text-slate-600">Revenue</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#EBA050]" /><span className="text-xs font-semibold text-slate-600">Profit</span></div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(val) => `SAR ${val}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`SAR ${value}K`, ""]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#2A5C66" strokeWidth={3} strokeLinecap="round" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, stroke: "#2A5C66", strokeWidth: 2 }} />
                <Line type="monotone" dataKey="profit" stroke="#EBA050" strokeWidth={3} strokeLinecap="round" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, stroke: "#EBA050", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm p-6 flex flex-col">
          <div>
            <h2 className="text-base font-bold text-slate-800">Order Status</h2>
            <p className="text-xs text-slate-400 mt-1">Current state of 6.2K tracked orders</p>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center mt-4 relative">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                    {orderStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-3xl font-bold text-slate-800">6.2K</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Total Orders</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {orderStatusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-slate-500">{s.name}</p>
                  <p className="text-[13px] font-bold text-slate-800">{s.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Laundries Table */}
        <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Top Performing Laundries</h2>
              <p className="text-xs text-slate-400 mt-1">Ranked by completed order volume</p>
            </div>
            <button className="text-[12px] font-semibold text-[#2A5C66] hover:bg-[#2A5C66]/10 px-3 py-1.5 rounded-lg transition-colors">View All</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 rounded-tl-lg">Rank</th>
                  <th className="px-5 py-3">Laundry Name</th>
                  <th className="px-5 py-3">Completed</th>
                  <th className="px-5 py-3 rounded-tr-lg">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 text-[13px]">
                {topLaundries.map((laundry, i) => (
                  <tr key={laundry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${i < 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                        #{laundry.id}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{laundry.name}</p>
                      <p className="text-[11px] text-slate-400">{laundry.city}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-600">{laundry.orders}</td>
                    <td className="px-5 py-3 font-bold text-[#2A5C66]">{laundry.rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders by City & Recent Orders */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">Orders by City</h2>
            </div>
            <div className="space-y-3">
              {cityData.map((city) => (
                <div key={city.name} className="flex items-center gap-3">
                  <span className="text-[12px] font-medium text-slate-600 w-16">{city.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${city.value}%`, backgroundColor: city.color }} />
                  </div>
                  <span className="text-[12px] font-bold text-slate-800 w-8 text-right">{city.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[20px] shadow-sm flex flex-col flex-1">
            <div className="p-5 border-b border-slate-100/60 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Recent Orders</h2>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {recentOrdersList.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-800">{order.id} &bull; <span className="font-semibold text-slate-600">{order.customer}</span></span>
                    <span className="text-[11px] text-slate-400 mt-0.5">{order.laundry} &bull; {order.time}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[13px] font-bold text-slate-800">{order.amount}</span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health Score Card */}
      <div className="bg-gradient-to-r from-[#2A5C66] to-[#1D404A] rounded-[24px] p-6 text-white shadow-xl shadow-[#2A5C66]/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={160} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h2 className="text-xl font-bold">Platform Health IS OPTIMAL</h2>
               <p className="text-emerald-100 text-sm mt-1 max-w-md">System is running smoothly with 99.9% uptime and excellent satisfaction ratings locally and regionally.</p>
            </div>
            <div className="flex items-center gap-6 divide-x divide-white/20">
               <div className="px-4">
                  <p className="text-xs text-emerald-200 font-semibold tracking-wider uppercase mb-1">Health Score</p>
                  <p className="text-3xl font-bold">94.7%</p>
               </div>
               <div className="px-4">
                  <p className="text-xs text-emerald-200 font-semibold tracking-wider uppercase mb-1">Uptime</p>
                  <p className="text-3xl font-bold">99.9%</p>
               </div>
               <div className="px-4">
                  <p className="text-xs text-emerald-200 font-semibold tracking-wider uppercase mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold flex items-center gap-1">4.7 <span className="text-yellow-400">★</span></p>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
