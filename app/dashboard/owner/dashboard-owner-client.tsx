"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search, ChevronDown, ChevronRight, X, Pencil, AlertTriangle,
  Printer, Plus, Calendar,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

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
  kuliner: "#2DD4BF", ternak: "#8B5CF6", homeindustry: "#F59E0B", retail: "#EC4899",
};
const TYPE_LABEL: Record<string, string> = {
  kuliner: "F&B / Kuliner", ternak: "Peternakan", homeindustry: "Home Industri", retail: "Retail",
};
const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];

function fmtRp(n: number) {
  if (n >= 1000000) return "Rp" + (n / 1000000).toFixed(1) + "jt";
  if (n >= 1000) return "Rp" + Math.round(n / 1000) + "rb";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}
function fmtFull(n: number) { return "Rp" + Math.round(n).toLocaleString("id-ID"); }

export default function DashboardOwnerClient({ businesses, bulan, tahun, userId, userName }: {
  businesses: Business[]; bulan: number; tahun: number; userId: string; userName: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const rangeFilter = searchParams.get("range") || "month";
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().split("T")[0]);
  const [customTo, setCustomTo] = useState(new Date().toISOString().split("T")[0]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [targetInput, setTargetInput] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedBiz, setSelectedBiz] = useState<string>("all");
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [chartTab, setChartTab] = useState("Harian");

  const filteredBusinesses = selectedBiz === "all" ? businesses : businesses.filter(b => b.id === selectedBiz);
  const totalOmzet = filteredBusinesses.reduce((s, b) => s + b.omzetBulan, 0);
  const totalLaba = filteredBusinesses.reduce((s, b) => s + Math.max(0, b.labaBulan), 0);
  const totalRugi = filteredBusinesses.reduce((s, b) => s + Math.abs(Math.min(0, b.labaBulan)), 0);
  const totalOrder = filteredBusinesses.reduce((s, b) => s + b.totalOrderBulan, 0);
  const avgOrder = totalOrder > 0 ? Math.round(totalOmzet / totalOrder) : 0;
  const avgGrowth = filteredBusinesses.length > 0
    ? Math.round(filteredBusinesses.reduce((s, b) => s + b.growthPct, 0) / businesses.length)
    : 0;
  const ranked = [...filteredBusinesses].sort((a, b) => b.labaBulan - a.labaBulan);
  const topGrowth = [...filteredBusinesses].sort((a, b) => b.growthPct - a.growthPct)[0];

  const alerts = businesses
    .filter(b => b.stokKritis.length > 0)
    .map(b => ({
      id: "stok-" + b.id,
      title: b.name + " — " + b.stokKritis.length + " bahan hampir habis",
      sub: b.stokKritis.slice(0, 3).map(p => p.name).join(", "),
    }));
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  const allExpenses: Record<string, number> = {};
  businesses.forEach(b => {
    Object.entries(b.pengeluaranByCategory).forEach(([cat, amt]) => {
      allExpenses[cat] = (allExpenses[cat] || 0) + amt;
    });
  });
  const totalExpense = Object.values(allExpenses).reduce((s, v) => s + v, 0);

  const setRange = (r: string) => router.push("/dashboard/owner?range=" + r);
  const applyCustom = () => {
    router.push("/dashboard/owner?range=custom&from=" + customFrom + "&to=" + customTo);
    setShowDatePicker(false);
  };

  const saveTarget = async (bizId: string) => {
    setSavingTarget(true);
    await supabase.from("business_targets").upsert(
      { business_id: bizId, user_id: userId, bulan, tahun, target_omzet: Number(targetInput) || 0 },
      { onConflict: "business_id,bulan,tahun" },
    );
    setSavingTarget(false);
    setEditingTarget(null);
    router.refresh();
  };

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const dateKey = tahun + "-" + String(bulan).padStart(2, "0") + "-" + day;
    const total = filteredBusinesses.reduce((s, b) => s + (b.dailyMap[dateKey] || 0), 0);
    return { day: i + 1, omzet: Math.round(total / 1000) };
  });

  const donutData = filteredBusinesses
    .filter(b => b.omzetBulan > 0)
    .map(b => ({ name: b.name, value: b.omzetBulan, color: TYPE_COLOR[b.type] || "#8B8AA0" }));

  const filterBtn = (active: boolean) =>
    [
      "rounded-lg px-3 py-1.5 text-xs transition-all duration-200 cursor-pointer",
      active
        ? "border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#2DD4BF] shadow-[0_0_12px_rgba(45,212,191,0.12)]"
        : "border border-white/[0.08] bg-[#0D0D1A] text-[#8B8AA0] hover:border-white/15 hover:text-[#C4C3D4]",
    ].join(" ");

  return (
    <div className="min-h-screen bg-[#070711] text-[#F0EFF8]">

      {/* Header greeting */}
      <div className="fade-up border-b border-white/[0.06] px-5 py-4">
        <h1 className="text-xl font-bold text-[#F0EFF8]">Halo, {userName} 👋</h1>
        <p className="mt-1 text-xs text-[#5A5B7A]">
          Berikut ringkasan performa bisnismu · {BULAN[bulan - 1]} {tahun}
        </p>
      </div>

      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-5 py-2.5">
        <div className="relative min-w-[160px] flex-1 max-w-[220px]">
          <Search size={11} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3A3B52]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari bisnis..."
            className="gercep-input w-full rounded-lg py-1.5 pl-7 pr-2.5 text-xs outline-none transition-colors focus:border-[#2DD4BF]/30"
          />
        </div>

        {[{ k: "today", l: "Hari ini" }, { k: "month", l: "Bulan ini" }, { k: "year", l: "Tahun ini" }].map(f => (
          <button key={f.k} onClick={() => setRange(f.k)} className={filterBtn(rangeFilter === f.k)}>{f.l}</button>
        ))}

        <div className="relative">
          <button onClick={() => setShowDatePicker(!showDatePicker)} className={filterBtn(rangeFilter === "custom") + " flex items-center gap-1.5"}>
            <Calendar size={11} /> Custom
          </button>
          {showDatePicker && (
            <div className="scale-in absolute left-0 top-10 z-50 w-[210px] rounded-[10px] border border-white/10 bg-[#161622] p-3.5 shadow-2xl">
              <label className="mb-1 block text-[10px] text-[#5A5B7A]">Dari</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="mb-2 w-full rounded-md border border-white/[0.08] bg-[#070711] px-2 py-1.5 text-xs text-[#F0EFF8] outline-none [color-scheme:dark]" />
              <label className="mb-1 block text-[10px] text-[#5A5B7A]">Sampai</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="mb-2.5 w-full rounded-md border border-white/[0.08] bg-[#070711] px-2 py-1.5 text-xs text-[#F0EFF8] outline-none [color-scheme:dark]" />
              <button onClick={applyCustom} className="gercep-gradient-btn w-full rounded-md py-1.5 text-xs font-bold">Terapkan</button>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setShowBizDropdown(!showBizDropdown)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0D0D1A] px-3 py-1.5 text-xs text-[#8B8AA0] transition-colors hover:border-white/15">
            🏢 {selectedBiz === "all" ? "Semua Bisnis" : (businesses.find(b => b.id === selectedBiz)?.name || "Bisnis")} ▼
          </button>
          {showBizDropdown && (
            <div className="scale-in absolute right-0 top-10 z-50 min-w-[200px] rounded-[10px] border border-white/10 bg-[#161622] p-1.5 shadow-2xl">
              <button onClick={() => { setSelectedBiz("all"); setShowBizDropdown(false); }}
                className={["flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-left transition-colors",
                  selectedBiz === "all" ? "bg-[#2DD4BF]/10 text-[#2DD4BF]" : "text-[#C4C3D4] hover:bg-white/[0.04]"].join(" ")}>
                🌐 Semua Bisnis
              </button>
              {businesses.map(b => (
                <button key={b.id} onClick={() => { setSelectedBiz(b.id); setShowBizDropdown(false); }}
                  className={["flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-left transition-colors",
                    selectedBiz === b.id ? "bg-[#2DD4BF]/10 text-[#2DD4BF]" : "text-[#C4C3D4] hover:bg-white/[0.04]"].join(" ")}>
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: TYPE_COLOR[b.type] || "#8B8AA0" }} />
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowNotif(!showNotif)}
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-[#0D0D1A] text-[#8B8AA0] transition-colors hover:border-white/15">
          🔔
          {visibleAlerts.length > 0 && (
            <span className="gercep-gradient-btn absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold">
              {visibleAlerts.length}
            </span>
          )}
        </button>

        <div className="gercep-gradient-btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-bold">
          {userName[0].toUpperCase()}
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={() => window.print()}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0D0D1A] px-3 py-1.5 text-xs text-[#8B8AA0] transition-colors hover:border-white/15 hover:text-[#C4C3D4]">
            <Printer size={11} /> Cetak
          </button>
          <button onClick={() => router.push("/dashboard/onboarding")}
            className="gercep-gradient-btn flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-opacity hover:opacity-90">
            <Plus size={11} /> Bisnis
          </button>
        </div>
      </div>

      {/* Main layout: content + right sidebar */}
      <div className="owner-main-layout flex items-start gap-4 p-4 sm:p-5">

        {/* Left column */}
        <div className="min-w-0 flex-1">

          {/* KPI cards */}
          <div className="owner-grid-kpi mb-4 grid grid-cols-5 gap-2.5">
            {[
              { label: "Total Omzet", value: fmtFull(totalOmzet), delta: avgGrowth, color: "#2DD4BF" },
              { label: "Total Laba", value: fmtFull(totalLaba), delta: avgGrowth, color: "#8B5CF6" },
              { label: "Total Rugi", value: fmtFull(totalRugi), delta: 0, color: "#EC4899", down: true },
              { label: "Total Order", value: String(totalOrder), delta: 5, color: "#F59E0B" },
              { label: "Rata-rata Order", value: fmtRp(avgOrder), delta: 3, color: "#2DD4BF" },
            ].map((k, i) => (
              <div key={i} className="gercep-card gercep-card-hover fade-up p-3.5" style={{ borderBottom: "2.5px solid " + k.color, animationDelay: `${i * 0.05}s` }}>
                <p className="mb-1.5 text-[10px] text-[#5A5B7A]">{k.label}</p>
                <p className="mb-1 font-mono text-[17px] font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px]" style={{ color: k.down ? "#EC4899" : "#2DD4BF" }}>
                  {k.down ? "↓" : "↑"}{Math.abs(k.delta)}% vs periode lalu
                </p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="gercep-card gercep-card-hover fade-up mb-4 p-4">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold">Grafik Omzet</p>
              <div className="flex gap-0.5 rounded-lg bg-[#070711] p-0.5">
                {["Harian", "Mingguan", "Bulanan"].map(t => (
                  <button key={t} onClick={() => setChartTab(t)}
                    className={["rounded-md px-2.5 py-1 text-[11px] transition-all cursor-pointer",
                      chartTab === t ? "gercep-gradient-btn font-bold" : "text-[#5A5B7A] hover:text-[#8B8AA0]"].join(" ")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#3A3B52" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: "#3A3B52" }} tickLine={false} axisLine={false} tickFormatter={v => "Rp" + v + "rb"} width={55} />
                <Tooltip contentStyle={{ background: "#0D0D1A", border: "0.5px solid rgba(45,212,191,.3)", borderRadius: 8, fontSize: 11, color: "#F0EFF8" }} />
                <Line type="monotone" dataKey="omzet" stroke="#2DD4BF" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#2DD4BF" }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 border-t border-white/[0.05] pt-3.5 sm:grid-cols-4">
              {[
                { label: "Omzet Tertinggi", value: fmtRp(Math.max(...chartData.map(d => d.omzet), 0) * 1000), dot: "#EC4899" },
                { label: "Omzet Terendah", value: fmtRp(Math.min(...chartData.filter(d => d.omzet > 0).map(d => d.omzet), 0) * 1000), dot: "#8B5CF6" },
                { label: "Rata-rata Harian", value: fmtRp(Math.round(totalOmzet / 30)), dot: "#F59E0B" },
                { label: "Growth Terbaik", value: (topGrowth ? topGrowth.growthPct : 0) + "%", sub: topGrowth?.name || "-", dot: "#2DD4BF", pos: true },
              ].map((s, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-[#5A5B7A]">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: s.dot }} />
                    {s.label}
                  </div>
                  <div className={["font-mono text-[13px] font-semibold", s.pos ? "text-[#2DD4BF]" : "text-[#F0EFF8]"].join(" ")}>{s.value}</div>
                  {s.sub && <div className="truncate text-[10px] text-[#5A5B7A]">{s.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Ranking + Performa */}
          <div className="owner-grid-2 mb-4 grid grid-cols-2 gap-3">
            <div className="gercep-card gercep-card-hover p-4">
              <p className="mb-3 text-xs font-semibold text-[#F0EFF8]">Ranking Bisnis Paling Untung</p>
              {ranked.map((b, i) => {
                const maxLaba = Math.max(...ranked.map(x => Math.max(0, x.labaBulan)), 1);
                const rankColors = ["#F59E0B", "#9CA3AF", "#D97706"];
                const rankBg = ["rgba(245,158,11,.15)", "rgba(156,163,175,.15)", "rgba(217,119,6,.15)"];
                return (
                  <div key={b.id} className={["flex items-center gap-2.5 py-2", i < ranked.length - 1 ? "border-b border-white/[0.04]" : ""].join(" ")}>
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                      style={{ background: rankBg[i] || "rgba(255,255,255,.05)", color: rankColors[i] || "#8B8AA0" }}>
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="truncate text-[#E4E7EC]">{b.name}</span>
                        <span className="ml-2 flex-shrink-0 font-mono text-[#2DD4BF]">{fmtRp(Math.max(0, b.labaBulan))}</span>
                      </div>
                      <div className="h-[5px] overflow-hidden rounded-sm bg-white/[0.04]">
                        <div className="h-full rounded-sm transition-all duration-500"
                          style={{ width: Math.max(0, b.labaBulan) / maxLaba * 100 + "%", background: TYPE_COLOR[b.type] || "#8B8AA0" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="gercep-card gercep-card-hover p-4">
              <p className="mb-3 text-xs font-semibold text-[#F0EFF8]">Performa Per Bisnis</p>
              {businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).map(b => (
                <div key={b.id}>
                  <div onClick={() => setExpandedRow(expandedRow === b.id ? null : b.id)}
                    className="flex cursor-pointer items-center gap-2 border-b border-white/[0.04] py-2 transition-colors hover:bg-white/[0.02]">
                    {expandedRow === b.id
                      ? <ChevronDown size={11} className="flex-shrink-0 text-[#5A5B7A]" />
                      : <ChevronRight size={11} className="flex-shrink-0 text-[#5A5B7A]" />}
                    <span className="h-[7px] w-[7px] flex-shrink-0 rounded-full" style={{ background: TYPE_COLOR[b.type] || "#8B8AA0" }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] text-[#F0EFF8]">{b.name}</p>
                      <p className="text-[10px] text-[#5A5B7A]">{TYPE_LABEL[b.type] || b.type}</p>
                    </div>
                    <p className={["flex-shrink-0 font-mono text-[11px]", b.labaBulan >= 0 ? "text-[#2DD4BF]" : "text-[#EC4899]"].join(" ")}>
                      {fmtRp(b.omzetBulan)}
                    </p>
                  </div>
                  {expandedRow === b.id && (
                    <div className="my-1 rounded-lg bg-[#070711] px-3.5 py-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        {[["Omzet", fmtFull(b.omzetBulan)], ["Laba/Rugi", (b.labaBulan >= 0 ? "+" : "") + fmtFull(b.labaBulan)], ["Margin", b.margin + "%"], ["Order", String(b.totalOrderBulan)]].map(([k, v]) => (
                          <div key={k} className="rounded-md border border-white/[0.05] bg-[#0D0D1A] px-2.5 py-2">
                            <p className="mb-0.5 text-[10px] text-[#5A5B7A]">{k}</p>
                            <p className="font-mono text-xs font-semibold">{v}</p>
                          </div>
                        ))}
                      </div>
                      {b.stokKritis.length > 0 && (
                        <div className="mt-2 rounded-md border border-[#F59E0B]/15 bg-[#F59E0B]/[0.06] px-2.5 py-1.5 text-[10px] text-[#F59E0B]">
                          Stok kritis: {b.stokKritis.map(p => p.name).join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown pengeluaran */}
          {totalExpense > 0 && (
            <div className="gercep-card gercep-card-hover mb-4 p-4">
              <p className="mb-3 text-xs font-semibold text-[#F0EFF8]">Breakdown Pengeluaran</p>
              {Object.entries(allExpenses).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} className="mb-2 flex items-center gap-2.5">
                  <div className="w-[110px] flex-shrink-0 truncate text-[11px] text-[#8B8AA0]">{cat}</div>
                  <div className="h-[7px] flex-1 overflow-hidden rounded bg-white/[0.04]">
                    <div className="h-full rounded bg-gradient-to-r from-[#2DD4BF] to-[#8B5CF6] transition-all duration-500"
                      style={{ width: amt / totalExpense * 100 + "%" }} />
                  </div>
                  <div className="w-[85px] flex-shrink-0 text-right font-mono text-[11px]">{fmtFull(amt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="owner-right-col flex w-[255px] flex-shrink-0 flex-col gap-3">

          {/* Perlu Perhatian */}
          <div className="gercep-card gercep-card-hover p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold">Perlu Perhatian</p>
              <span className="text-[10px] text-[#2DD4BF]">{visibleAlerts.length} alert</span>
            </div>
            {visibleAlerts.length === 0 && (
              <p className="py-2.5 text-center text-[11px] text-[#3A3B52]">Semua aman ✓</p>
            )}
            {visibleAlerts.map(a => (
              <div key={a.id} className="flex items-center gap-2 border-b border-white/[0.04] py-2">
                <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md bg-[#EC4899]/10">
                  <AlertTriangle size={11} className="text-[#EC4899]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-[#F0EFF8]">{a.title}</p>
                  <p className="truncate text-[10px] text-[#5A5B7A]">{a.sub}</p>
                </div>
                <button onClick={() => router.push("/dashboard/inventory")}
                  className="cursor-pointer rounded-md bg-[#EC4899]/10 px-2 py-0.5 text-[10px] text-[#EC4899] transition-colors hover:bg-[#EC4899]/20">
                  Lihat
                </button>
                <button onClick={() => setDismissedAlerts(prev => [...prev, a.id])}
                  className="flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-md border border-white/[0.08] text-[#5A5B7A] transition-colors hover:text-[#C4C3D4]">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          {/* Kontribusi Per Bisnis */}
          <div className="gercep-card gercep-card-hover p-4">
            <p className="mb-3 text-xs font-semibold text-[#F0EFF8]">Kontribusi Per Bisnis</p>
            {totalOmzet > 0 ? (
              <>
                <PieChart width={223} height={110}>
                  <Pie data={donutData} cx={111} cy={55} innerRadius={34} outerRadius={50} dataKey="value" paddingAngle={2}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => fmtFull(Number(v))} contentStyle={{ background: "#0D0D1A", border: "0.5px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
                {businesses.map(b => (
                  <div key={b.id} className="flex items-center gap-1.5 border-b border-white/[0.04] py-1">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: TYPE_COLOR[b.type] || "#8B8AA0" }} />
                    <span className="flex-1 truncate text-[10px] text-[#8B8AA0]">{b.name}</span>
                    <span className="mr-1.5 text-[10px] text-[#5A5B7A]">{totalOmzet > 0 ? Math.round(b.omzetBulan / totalOmzet * 100) : 0}%</span>
                    <span className="font-mono text-[10px] text-[#F0EFF8]">{fmtRp(b.omzetBulan)}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="py-5 text-center text-[11px] text-[#3A3B52]">Belum ada omzet</p>
            )}
          </div>

          {/* Insight AI */}
          <div className="rounded-[13px] border border-[#2DD4BF]/20 bg-gradient-to-br from-[#2DD4BF]/[0.08] to-[#8B5CF6]/[0.04] p-3.5">
            <div className="gercep-gradient-btn mb-2.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold">
              Insight AI ❖ Baru
            </div>
            {topGrowth && (
              <div className="mb-1.5 flex gap-1.5 text-[11px] leading-relaxed text-[#8B8AA0]">
                <span className="flex-shrink-0 text-[#2DD4BF]">✓</span>
                <span><strong className="text-[#F0EFF8]">{topGrowth.name}</strong> {topGrowth.growthPct >= 0 ? "tumbuh" : "turun"} {Math.abs(topGrowth.growthPct)}% dibanding periode lalu.</span>
              </div>
            )}
            {visibleAlerts.length > 0 && (
              <div className="mb-1.5 flex gap-1.5 text-[11px] leading-relaxed text-[#8B8AA0]">
                <span className="flex-shrink-0 text-[#EC4899]">⚠</span>
                <span>{visibleAlerts.length} bisnis dengan stok hampir habis. Cek segera.</span>
              </div>
            )}
            <div className="mb-1.5 flex gap-1.5 text-[11px] leading-relaxed text-[#8B8AA0]">
              <span className="flex-shrink-0 text-[#2DD4BF]">✓</span>
              <span>Total {businesses.length} bisnis aktif dengan {totalOrder} order bulan ini.</span>
            </div>
            <button className="gercep-gradient-btn mt-1.5 w-full cursor-pointer rounded-lg py-2 text-[11px] font-bold transition-opacity hover:opacity-90">
              Lihat Analisis Lengkap →
            </button>
          </div>

          {/* Target Omzet */}
          <div className="gercep-card gercep-card-hover p-4">
            <p className="mb-3 text-xs font-semibold text-[#F0EFF8]">Target Omzet</p>
            {businesses.map(b => {
              const pct = Math.min(100, b.targetPct);
              const color = pct >= 90 ? "#2DD4BF" : pct >= 50 ? "#F59E0B" : "#EC4899";
              return (
                <div key={b.id} className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex-1 truncate text-[11px] text-[#C4C3D4]">{b.name}</span>
                    <div className="ml-2 flex flex-shrink-0 items-center gap-1.5">
                      <span className="font-mono text-[10px]" style={{ color }}>{b.targetOmzet > 0 ? pct + "%" : "-"}</span>
                      <button onClick={() => { setEditingTarget(b.id); setTargetInput(String(b.targetOmzet)); }}
                        className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded border border-white/[0.08] text-[#5A5B7A] transition-colors hover:text-[#C4C3D4]">
                        <Pencil size={9} />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-sm bg-white/[0.04]">
                    <div className="h-full rounded-sm transition-all duration-500" style={{ width: pct + "%", background: color }} />
                  </div>
                  <div className="mt-0.5 flex justify-between text-[10px] text-[#5A5B7A]">
                    <span>{fmtRp(b.omzetBulan)}</span>
                    <span>{b.targetOmzet > 0 ? fmtRp(b.targetOmzet) : "Belum diset"}</span>
                  </div>
                  {editingTarget === b.id && (
                    <div className="mt-1.5 flex gap-1.5">
                      <input type="number" value={targetInput} onChange={e => setTargetInput(e.target.value)} placeholder="Target (Rp)"
                        className="gercep-input flex-1 rounded-md px-2 py-1 font-mono text-[11px] outline-none" />
                      <button onClick={() => saveTarget(b.id)} disabled={savingTarget}
                        className="cursor-pointer rounded-md bg-[#2DD4BF] px-2.5 py-1 text-[11px] font-bold text-[#070711] disabled:opacity-50">
                        {savingTarget ? "..." : "✓"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ekspor Rekap */}
          <div className="gercep-card gercep-card-hover p-4">
            <p className="mb-3 text-xs font-semibold text-[#F0EFF8]">Ekspor Rekap</p>
            {[
              { icon: "📊", label: "Excel · semua bisnis" },
              { icon: "📄", label: "PDF · laporan bulanan" },
              { icon: "💬", label: "Kirim ke WhatsApp" },
              { icon: "⏰", label: "Jadwalkan otomatis" },
            ].map((item, i) => (
              <div key={i} className={["flex cursor-pointer items-center justify-between py-2 transition-colors hover:text-[#C4C3D4]",
                i < 3 ? "border-b border-white/[0.04]" : ""].join(" ")}>
                <span className="text-[11px] text-[#8B8AA0]">{item.icon} {item.label}</span>
                <ChevronRight size={11} className="text-[#3A3B52]" />
              </div>
            ))}
            <div className="mt-3 flex gap-1.5">
              <button className="flex-1 cursor-pointer rounded-lg border border-white/[0.08] bg-[#161622] py-2 text-[11px] text-[#8B8AA0] transition-colors hover:border-white/15">
                Preview
              </button>
              <button className="gercep-gradient-btn flex-1 cursor-pointer rounded-lg py-2 text-[11px] font-bold transition-opacity hover:opacity-90">
                Unduh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
