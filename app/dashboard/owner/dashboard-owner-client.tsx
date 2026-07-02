"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, X, AlertTriangle, Calendar, ChevronDown, Bell,
  TrendingUp, TrendingDown, ShoppingBag, Receipt, DollarSign,
  ArrowUpRight, ArrowDownRight, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { TopProduct, RecentTransaction } from "./page";

type Business = {
  id: string; name: string; type: string;
  omzetBulan: number; labaBulan: number; omzetBulanLalu: number; omzetTahun: number; growthPct: number;
  totalOrderBulan: number;
  stokKritis: { id: string; name: string; stock: number; min_stock: number }[];
  pengeluaranByCategory: Record<string, number>;
  targetOmzet: number; targetPct: number; margin: number;
  dailyMap: Record<string, number>;
};

const TYPE_COLOR: Record<string, string> = {
  kuliner: "#10b981", ternak: "#8b5cf6", homeindustry: "#f59e0b", retail: "#3b82f6",
};
const BULAN_FULL = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const BULAN_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];

function fmtRp(n: number) {
  if (n >= 1000000) return "Rp" + (n / 1000000).toFixed(1).replace(".0", "") + "jt";
  if (n >= 1000) return "Rp" + Math.round(n / 1000) + "rb";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}
function fmtFull(n: number) { return "Rp" + Math.round(n).toLocaleString("id-ID"); }

const STATUS_STYLE: Record<string, string> = {
  Selesai: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Diproses: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

export default function DashboardOwnerClient({
  businesses, topProducts, recentTransactions, bulan, tahun, userId, userName,
}: {
  businesses: Business[];
  topProducts: TopProduct[];
  recentTransactions: RecentTransaction[];
  bulan: number; tahun: number; userId: string; userName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rangeFilter = searchParams.get("range") || "month";
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().split("T")[0]);
  const [customTo, setCustomTo] = useState(new Date().toISOString().split("T")[0]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBiz, setSelectedBiz] = useState<string>("all");
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [chartTab, setChartTab] = useState("Harian");

  const filteredBusinesses = selectedBiz === "all" ? businesses : businesses.filter(b => b.id === selectedBiz);
  const totalOmzet = filteredBusinesses.reduce((s, b) => s + b.omzetBulan, 0);
  const totalLaba = filteredBusinesses.reduce((s, b) => s + Math.max(0, b.labaBulan), 0);
  const totalRugi = filteredBusinesses.reduce((s, b) => s + Math.abs(Math.min(0, b.labaBulan)), 0);
  const totalOrder = filteredBusinesses.reduce((s, b) => s + b.totalOrderBulan, 0);
  const avgOrder = totalOrder > 0 ? Math.round(totalOmzet / totalOrder) : 0;
  const avgGrowth = filteredBusinesses.length > 0
    ? Math.round(filteredBusinesses.reduce((s, b) => s + b.growthPct, 0) / filteredBusinesses.length)
    : 0;
  const topGrowth = [...filteredBusinesses].sort((a, b) => b.growthPct - a.growthPct)[0];

  const alerts = businesses
    .filter(b => b.stokKritis.length > 0)
    .map(b => ({
      id: "stok-" + b.id,
      title: b.name + " — " + b.stokKritis.length + " bahan hampir habis",
      sub: b.stokKritis.slice(0, 3).map(p => p.name).join(", "),
    }));
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  const setRange = (r: string) => router.push("/dashboard/owner?range=" + r);
  const applyCustom = () => {
    router.push("/dashboard/owner?range=custom&from=" + customFrom + "&to=" + customTo);
    setShowDatePicker(false);
  };

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const dateKey = tahun + "-" + String(bulan).padStart(2, "0") + "-" + day;
    const total = filteredBusinesses.reduce((s, b) => s + (b.dailyMap[dateKey] || 0), 0);
    return { day: i + 1, label: BULAN_SHORT[bulan - 1] + " " + (i + 1), omzet: Math.round(total / 1000) };
  });

  const donutData = filteredBusinesses
    .filter(b => b.omzetBulan > 0)
    .map(b => ({ name: b.name, value: b.omzetBulan, color: TYPE_COLOR[b.type] || "#8b5cf6" }));

  const today = new Date();
  const dateLabel = today.getDate() + " " + BULAN_FULL[today.getMonth()] + " " + today.getFullYear();

  const kpis = [
    { label: "Total Omzet", value: fmtFull(totalOmzet), delta: avgGrowth, icon: TrendingUp, iconBg: "bg-violet-500/15", iconColor: "text-violet-400", positive: true },
    { label: "Total Laba", value: fmtFull(totalLaba), delta: avgGrowth, icon: DollarSign, iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", positive: true },
    { label: "Total Rugi", value: fmtFull(totalRugi), delta: 0, icon: TrendingDown, iconBg: "bg-red-500/15", iconColor: "text-red-400", positive: false },
    { label: "Total Order", value: String(totalOrder), delta: 5, icon: ShoppingBag, iconBg: "bg-blue-500/15", iconColor: "text-blue-400", positive: true },
    { label: "Rata-rata Order", value: fmtRp(avgOrder), delta: 3, icon: Receipt, iconBg: "bg-amber-500/15", iconColor: "text-amber-400", positive: true },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100">

      {/* ── Header ── */}
      <header className="border-b border-white/[0.06] px-6 py-5 no-print">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="fade-up">
            <h1 className="text-2xl font-bold text-white">Halo, {userName} 👋</h1>
            <p className="mt-1 text-sm text-slate-500">
              Berikut ringkasan performa bisnismu · {BULAN_FULL[bulan - 1]} {tahun}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 fade-up" style={{ animationDelay: "0.05s" }}>
            {/* Search */}
            <div className="relative min-w-[180px] flex-1 xl:max-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari bisnis..."
                className="w-full rounded-xl border border-white/[0.07] bg-[#151921] py-2 pl-9 pr-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-violet-500/40"
              />
            </div>

            {/* Date picker */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#151921] px-3 py-2 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-slate-200"
              >
                <Calendar size={14} />
                <span className="hidden sm:inline">{dateLabel}</span>
                <ChevronDown size={13} />
              </button>
              {showDatePicker && (
                <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-white/10 bg-[#1a2030] p-4 shadow-2xl scale-in">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Periode</p>
                  {[{ k: "today", l: "Hari ini" }, { k: "month", l: "Bulan ini" }, { k: "year", l: "Tahun ini" }].map(f => (
                    <button key={f.k} onClick={() => { setRange(f.k); setShowDatePicker(false); }}
                      className={["mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        rangeFilter === f.k ? "bg-violet-600/20 text-violet-300" : "text-slate-400 hover:bg-white/[0.04]"].join(" ")}>
                      {f.l}
                    </button>
                  ))}
                  <div className="my-2 border-t border-white/[0.06]" />
                  <label className="mb-1 block text-[10px] text-slate-500">Dari</label>
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="mb-2 w-full rounded-lg border border-white/[0.08] bg-[#0b0e14] px-2 py-1.5 text-xs text-slate-300 outline-none" />
                  <label className="mb-1 block text-[10px] text-slate-500">Sampai</label>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="mb-3 w-full rounded-lg border border-white/[0.08] bg-[#0b0e14] px-2 py-1.5 text-xs text-slate-300 outline-none" />
                  <button onClick={applyCustom}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-xs font-bold text-white">
                    Terapkan
                  </button>
                </div>
              )}
            </div>

            {/* Business filter */}
            <div className="relative">
              <button
                onClick={() => setShowBizDropdown(!showBizDropdown)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#151921] px-3 py-2 text-sm text-slate-400 transition-colors hover:border-violet-500/30 hover:text-slate-200"
              >
                🏢 {selectedBiz === "all" ? "Semua Bisnis" : (businesses.find(b => b.id === selectedBiz)?.name || "Bisnis")}
                <ChevronDown size={13} />
              </button>
              {showBizDropdown && (
                <div className="absolute right-0 top-11 z-50 min-w-[200px] rounded-2xl border border-white/10 bg-[#1a2030] p-2 shadow-2xl scale-in">
                  <button onClick={() => { setSelectedBiz("all"); setShowBizDropdown(false); }}
                    className={["flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                      selectedBiz === "all" ? "bg-violet-600/20 text-violet-300" : "text-slate-400 hover:bg-white/[0.04]"].join(" ")}>
                    🌐 Semua Bisnis
                  </button>
                  {businesses.map(b => (
                    <button key={b.id} onClick={() => { setSelectedBiz(b.id); setShowBizDropdown(false); }}
                      className={["flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                        selectedBiz === b.id ? "bg-violet-600/20 text-violet-300" : "text-slate-400 hover:bg-white/[0.04]"].join(" ")}>
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: TYPE_COLOR[b.type] || "#8b5cf6" }} />
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#151921] text-slate-400 transition-colors hover:border-violet-500/30 hover:text-slate-200">
              <Bell size={15} />
              {visibleAlerts.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {visibleAlerts.length}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
              {userName[0].toUpperCase()}
            </div>

            {/* Tambah Bisnis */}
            <button
              onClick={() => router.push("/dashboard/onboarding")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", border: "none", cursor: "pointer" }}
            >
              + Bisnis
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className="dashboard-card dashboard-card-hover fade-up p-5"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.iconBg}`}>
                  <k.icon size={18} className={k.iconColor} />
                </div>
                <span className="text-[11px] text-slate-500">{k.label}</span>
              </div>
              <p className="mb-2 text-xl font-bold text-white">{k.value}</p>
              <div className={`flex items-center gap-1 text-[11px] ${k.positive ? "text-emerald-400" : "text-red-400"}`}>
                {k.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(k.delta)}% vs bulan lalu
              </div>
            </div>
          ))}
        </div>

        {/* ── Chart + Alerts ── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Chart */}
          <div className="dashboard-card fade-up p-5 xl:col-span-2" style={{ animationDelay: "0.1s" }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">Grafik Omzet</h2>
              <div className="flex gap-1 rounded-xl bg-[#0b0e14] p-1">
                {["Harian", "Mingguan", "Bulanan"].map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setChartTab(t)}
                    className={[
                      "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all",
                      chartTab === t
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-300",
                    ].join(" ")}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={v => "Rp" + v + "rb"} width={55} />
                <Tooltip
                  contentStyle={{ background: "#151921", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, fontSize: 12, color: "#f8fafc" }}
                  formatter={(v: unknown) => [fmtFull(Number(v) * 1000), "Omzet"]}
                />
                <Area type="monotone" dataKey="omzet" stroke="#7c3aed" strokeWidth={2.5} fill="url(#omzetGrad)" dot={false} activeDot={{ r: 5, fill: "#7c3aed", stroke: "#a78bfa", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
              {[
                { label: "Omzet Tertinggi", value: fmtRp(Math.max(...chartData.map(d => d.omzet), 0) * 1000), dot: "#ef4444" },
                { label: "Omzet Terendah", value: fmtRp(Math.min(...chartData.filter(d => d.omzet > 0).map(d => d.omzet), 0) * 1000), dot: "#8b5cf6" },
                { label: "Rata-rata Harian", value: fmtRp(Math.round(totalOmzet / 30)), dot: "#f59e0b" },
                { label: "Growth Terbaik", value: (topGrowth?.growthPct ?? 0) + "%", sub: topGrowth?.name, dot: "#10b981" },
              ].map(s => (
                <div key={s.label}>
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
                    {s.label}
                  </div>
                  <p className="text-sm font-semibold text-white">{s.value}</p>
                  {s.sub && <p className="truncate text-[10px] text-slate-600">{s.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Perlu Perhatian */}
          <div className="dashboard-card fade-up p-5" style={{ animationDelay: "0.15s" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Perlu Perhatian</h2>
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400">
                {visibleAlerts.length} alert
              </span>
            </div>
            {visibleAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">✓</div>
                <p className="text-sm text-slate-500">Semua aman, tidak ada alert</p>
              </div>
            ) : (
              <div className="space-y-1">
                {visibleAlerts.map(a => (
                  <div key={a.id} className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.02]">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                      <AlertTriangle size={14} className="text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">{a.title}</p>
                      <p className="truncate text-[11px] text-slate-500">{a.sub}</p>
                    </div>
                    <div className="flex flex-shrink-0 gap-1">
                      <button onClick={() => router.push("/dashboard/inventory")}
                        className="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20">
                        Lihat
                      </button>
                      <button onClick={() => setDismissedAlerts(prev => [...prev, a.id])}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/[0.08] text-slate-500 transition-colors hover:text-slate-300">
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

          {/* Top Produk Terlaris */}
          <div className="dashboard-card dashboard-card-hover fade-up p-5" style={{ animationDelay: "0.2s" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Top Produk Terlaris</h2>
              <button className="text-[11px] text-violet-400 transition-colors hover:text-violet-300">Lihat Semua</button>
            </div>
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">Belum ada data produk</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-4 flex-shrink-0 text-center text-[11px] font-bold text-slate-600">{i + 1}</span>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#0b0e14] text-base">
                      {p.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{p.sold > 0 ? p.sold + " terjual" : "Belum terjual"}</p>
                    </div>
                    <p className="flex-shrink-0 text-sm font-semibold text-white">{fmtRp(p.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaksi Terbaru */}
          <div className="dashboard-card dashboard-card-hover fade-up p-5" style={{ animationDelay: "0.25s" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Transaksi Terbaru</h2>
              <button className="text-[11px] text-violet-400 transition-colors hover:text-violet-300">Lihat Semua</button>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">Belum ada transaksi</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-600/30 text-xs font-bold text-violet-300">
                      {tx.customer[0]?.toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">{tx.customer}</p>
                      <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLE[tx.status]}`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-white">{fmtRp(tx.amount)}</p>
                      <p className="text-[10px] text-slate-600">{tx.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Channel Penjualan */}
          <div className="dashboard-card dashboard-card-hover fade-up p-5" style={{ animationDelay: "0.3s" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Channel Penjualan</h2>
              <button className="text-[11px] text-violet-400 transition-colors hover:text-violet-300">Detail</button>
            </div>
            {donutData.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">Belum ada data</p>
            ) : (
              <>
                <div className="relative mx-auto mb-3" style={{ width: 140, height: 140 }}>
                  <PieChart width={140} height={140}>
                    <Pie data={donutData} cx={70} cy={70} innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-slate-500">Total</p>
                    <p className="text-xs font-bold text-white">{fmtRp(totalOmzet)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {donutData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="flex-1 truncate text-[11px] text-slate-400">{d.name}</span>
                      <span className="text-[11px] text-slate-500">{totalOmzet > 0 ? Math.round(d.value / totalOmzet * 100) : 0}%</span>
                      <span className="text-[11px] font-medium text-slate-300">{fmtRp(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Insight AI */}
          <div
            className="fade-up overflow-hidden rounded-2xl border border-violet-500/25 p-5"
            style={{
              animationDelay: "0.35s",
              background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.12) 50%, rgba(99,102,241,0.08) 100%)",
            }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  ✦ Insight AI
                </span>
                <span className="ml-2 rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">Baru</span>
              </div>
              <span className="text-3xl">🤖</span>
            </div>
            <div className="mb-4 space-y-2.5">
              {topGrowth && (
                <div className="flex gap-2 text-[12px] leading-relaxed text-slate-400">
                  <span className="flex-shrink-0 text-emerald-400">✓</span>
                  <span><strong className="text-slate-200">{topGrowth.name}</strong> {topGrowth.growthPct >= 0 ? "tumbuh" : "turun"} {Math.abs(topGrowth.growthPct)}% dibanding periode lalu.</span>
                </div>
              )}
              {visibleAlerts.length > 0 && (
                <div className="flex gap-2 text-[12px] leading-relaxed text-slate-400">
                  <span className="flex-shrink-0 text-amber-400">⚠</span>
                  <span>{visibleAlerts.length} bisnis dengan stok hampir habis. Cek segera.</span>
                </div>
              )}
              <div className="flex gap-2 text-[12px] leading-relaxed text-slate-400">
                <span className="flex-shrink-0 text-emerald-400">✓</span>
                <span>Total {businesses.length} bisnis aktif dengan {totalOrder} order bulan ini.</span>
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Lihat Analisis Lengkap
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
