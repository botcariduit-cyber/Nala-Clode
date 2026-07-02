"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, ChevronDown, ChevronRight, X, Pencil, AlertTriangle, TrendingUp, Printer, Plus, Calendar, FileSpreadsheet, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Business = {
  id: string; name: string; type: string;
  omzetBulan: number; labaBulan: number; omzetBulanLalu: number; omzetTahun: number; growthPct: number;
  totalOrderBulan: number;
  stokKritis: { id: string; name: string; stock: number; min_stock: number }[];
  pengeluaranByCategory: Record<string, number>;
  targetOmzet: number; targetPct: number; margin: number;
  dailyMap: Record<string, number>;
};

const TYPE_COLOR: Record<string, string> = { kuliner: "#2DD4BF", ternak: "#8B5CF6", homeindustry: "#F59E0B", retail: "#EC4899" };
const TYPE_LABEL: Record<string, string> = { kuliner: "F&B / Kuliner", ternak: "Peternakan", homeindustry: "Home Industri", retail: "Retail" };
const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];

function fmtRp(n: number) {
  if (n >= 1000000) return "Rp" + (n / 1000000).toFixed(1) + "jt";
  if (n >= 1000) return "Rp" + Math.round(n / 1000) + "rb";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}
function fmtFull(n: number) { return "Rp" + Math.round(n).toLocaleString("id-ID"); }

const S = {
  card: { background: "#0D0D1A", border: "0.5px solid rgba(255,255,255,.06)", borderRadius: 13, padding: 16 } as React.CSSProperties,
  label: { fontSize: 10, color: "#5A5B7A", marginBottom: 6 } as React.CSSProperties,
  title: { fontSize: 12, fontWeight: 600, color: "#F0EFF8", marginBottom: 12 } as React.CSSProperties,
};

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

  const totalOmzet = businesses.reduce((s, b) => s + b.omzetBulan, 0);
  const totalLaba = businesses.reduce((s, b) => s + Math.max(0, b.labaBulan), 0);
  const totalRugi = businesses.reduce((s, b) => s + Math.abs(Math.min(0, b.labaBulan)), 0);
  const totalOrder = businesses.reduce((s, b) => s + b.totalOrderBulan, 0);
  const avgOrder = totalOrder > 0 ? Math.round(totalOmzet / totalOrder) : 0;
  const avgGrowth = businesses.length > 0 ? Math.round(businesses.reduce((s, b) => s + b.growthPct, 0) / businesses.length) : 0;
  const ranked = [...businesses].sort((a, b) => b.labaBulan - a.labaBulan);
  const topGrowth = [...businesses].sort((a, b) => b.growthPct - a.growthPct)[0];

  const alerts = businesses
    .filter(b => b.stokKritis.length > 0)
    .map(b => ({ id: "stok-" + b.id, biz: b, title: b.name + " — " + b.stokKritis.length + " bahan hampir habis", sub: b.stokKritis.slice(0, 3).map(p => p.name).join(", ") }));
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  const allExpenses: Record<string, number> = {};
  businesses.forEach(b => { Object.entries(b.pengeluaranByCategory).forEach(([cat, amt]) => { allExpenses[cat] = (allExpenses[cat] || 0) + amt; }); });
  const totalExpense = Object.values(allExpenses).reduce((s, v) => s + v, 0);

  const setRange = (r: string) => router.push("/dashboard/owner?range=" + r);
  const applyCustom = () => { router.push("/dashboard/owner?range=custom&from=" + customFrom + "&to=" + customTo); setShowDatePicker(false); };

  const saveTarget = async (bizId: string) => {
    setSavingTarget(true);
    await supabase.from("business_targets").upsert({ business_id: bizId, user_id: userId, bulan, tahun, target_omzet: Number(targetInput) || 0 }, { onConflict: "business_id,bulan,tahun" });
    setSavingTarget(false);
    setEditingTarget(null);
    router.refresh();
  };

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const dateKey = tahun + "-" + String(bulan).padStart(2, "0") + "-" + day;
    const total = businesses.reduce((s, b) => s + (b.dailyMap[dateKey] || 0), 0);
    return { day: i + 1, omzet: Math.round(total / 1000) };
  });

  const donutData = businesses.filter(b => b.omzetBulan > 0).map(b => ({ name: b.name, value: b.omzetBulan, color: TYPE_COLOR[b.type] || "#8B8AA0" }));

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F0EFF8", minHeight: "100vh", background: "#070711" }}>

      <div style={{ padding: "16px 20px 14px", borderBottom: "0.5px solid rgba(255,255,255,.06)" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#F0EFF8" }}>Halo, {userName} 👋</h1>
        <p style={{ fontSize: 12, color: "#5A5B7A", marginTop: 3 }}>Berikut ringkasan performa bisnismu · {BULAN[bulan - 1]} {tahun}</p>
      </div>

      <div style={{ padding: "10px 20px", borderBottom: "0.5px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 220 }}>
          <Search size={11} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#3A3B52" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bisnis..." style={{ background: "#0D0D1A", border: "0.5px solid rgba(255,255,255,.07)", borderRadius: 8, padding: "6px 10px 6px 28px", fontSize: 12, color: "#F0EFF8", outline: "none", width: "100%", fontFamily: "'Space Grotesk', sans-serif" }} />
        </div>
        {[{ k: "today", l: "Hari ini" }, { k: "month", l: "Bulan ini" }, { k: "year", l: "Tahun ini" }].map(f => (
          <button key={f.k} onClick={() => setRange(f.k)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: rangeFilter === f.k ? "0.5px solid #2DD4BF" : "0.5px solid rgba(255,255,255,.08)", background: rangeFilter === f.k ? "rgba(45,212,191,.1)" : "#0D0D1A", color: rangeFilter === f.k ? "#2DD4BF" : "#8B8AA0", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>{f.l}</button>
        ))}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowDatePicker(!showDatePicker)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: rangeFilter === "custom" ? "0.5px solid #2DD4BF" : "0.5px solid rgba(255,255,255,.08)", background: rangeFilter === "custom" ? "rgba(45,212,191,.1)" : "#0D0D1A", color: rangeFilter === "custom" ? "#2DD4BF" : "#8B8AA0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
            <Calendar size={11} /> Custom
          </button>
          {showDatePicker && (
            <div style={{ position: "absolute", top: 38, left: 0, background: "#161622", border: "0.5px solid rgba(255,255,255,.1)", borderRadius: 10, padding: 14, width: 210, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
              <label style={{ fontSize: 10, color: "#5A5B7A", display: "block", marginBottom: 4 }}>Dari</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ width: "100%", background: "#070711", border: "0.5px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "6px 8px", color: "#F0EFF8", fontSize: 12, marginBottom: 8, colorScheme: "dark", fontFamily: "'Space Grotesk', sans-serif" }} />
              <label style={{ fontSize: 10, color: "#5A5B7A", display: "block", marginBottom: 4 }}>Sampai</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ width: "100%", background: "#070711", border: "0.5px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "6px 8px", color: "#F0EFF8", fontSize: 12, marginBottom: 10, colorScheme: "dark", fontFamily: "'Space Grotesk', sans-serif" }} />
              <button onClick={applyCustom} style={{ width: "100%", background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", border: "none", borderRadius: 6, padding: 7, color: "#070711", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Terapkan</button>
            </div>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => window.print()} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,.08)", background: "#0D0D1A", color: "#8B8AA0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
            <Printer size={11} /> Cetak
          </button>
          <button style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", border: "none", color: "#070711", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
            <Plus size={11} /> Bisnis
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, padding: "16px 20px", alignItems: "flex-start" }}>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Total Omzet", value: fmtFull(totalOmzet), delta: avgGrowth, color: "#2DD4BF" },
              { label: "Total Laba", value: fmtFull(totalLaba), delta: avgGrowth, color: "#8B5CF6" },
              { label: "Total Rugi", value: fmtFull(totalRugi), delta: 0, color: "#EC4899", down: true },
              { label: "Total Order", value: String(totalOrder), delta: 5, color: "#F59E0B" },
              { label: "Rata-rata Order", value: fmtRp(avgOrder), delta: 3, color: "#2DD4BF" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#0D0D1A", border: "0.5px solid rgba(255,255,255,.06)", borderRadius: 13, padding: 14, borderBottom: "2.5px solid " + k.color }}>
                <p style={S.label}>{k.label}</p>
                <p style={{ fontSize: 17, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: k.color, marginBottom: 4 }}>{k.value}</p>
                <p style={{ fontSize: 10, color: k.down ? "#EC4899" : "#2DD4BF" }}>{k.down ? "↓" : "↑"}{Math.abs(k.delta)}% vs periode lalu</p>
              </div>
            ))}
          </div>

          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Grafik Omzet</p>
              <div style={{ display: "flex", gap: 3, background: "#070711", borderRadius: 8, padding: 3 }}>
                {["Harian", "Mingguan", "Bulanan"].map((t, i) => (
                  <button key={t} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none", background: i === 0 ? "linear-gradient(135deg,#2DD4BF,#8B5CF6)" : "transparent", color: i === 0 ? "#070711" : "#5A5B7A", cursor: "pointer", fontWeight: i === 0 ? 700 : 400, fontFamily: "'Space Grotesk', sans-serif" }}>{t}</button>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "0.5px solid rgba(255,255,255,.05)" }}>
              {[
                { label: "Omzet Tertinggi", value: fmtRp(Math.max(...chartData.map(d => d.omzet), 0) * 1000), dot: "#EC4899" },
                { label: "Omzet Terendah", value: fmtRp(Math.min(...chartData.filter(d => d.omzet > 0).map(d => d.omzet), 0) * 1000), dot: "#8B5CF6" },
                { label: "Rata-rata Harian", value: fmtRp(Math.round(totalOmzet / 30)), dot: "#F59E0B" },
                { label: "Growth Terbaik", value: (topGrowth ? topGrowth.growthPct : 0) + "%", sub: topGrowth?.name || "-", dot: "#2DD4BF", pos: true },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: "#5A5B7A", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                    {s.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "JetBrains Mono, monospace", color: s.pos ? "#2DD4BF" : "#F0EFF8" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={S.card}>
              <p style={S.title}>Ranking Bisnis Paling Untung</p>
              {ranked.map((b, i) => {
                const maxLaba = Math.max(...ranked.map(x => Math.max(0, x.labaBulan)), 1);
                const rankColors = ["#F59E0B", "#9CA3AF", "#D97706"];
                const rankBg = ["rgba(245,158,11,.15)", "rgba(156,163,175,.15)", "rgba(217,119,6,.15)"];
                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < ranked.length - 1 ? "0.5px solid rgba(255,255,255,.04)" : "none" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: rankBg[i] || "rgba(255,255,255,.05)", color: rankColors[i] || "#8B8AA0", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "#E4E7EC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#2DD4BF", flexShrink: 0, marginLeft: 8 }}>{fmtRp(Math.max(0, b.labaBulan))}</span>
                      </div>
                      <div style={{ height: 5, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: Math.max(0, b.labaBulan) / maxLaba * 100 + "%", background: TYPE_COLOR[b.type] || "#8B8AA0", borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={S.card}>
              <p style={S.title}>Performa Per Bisnis</p>
              {businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).map(b => (
                <div key={b.id}>
                  <div onClick={() => setExpandedRow(expandedRow === b.id ? null : b.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "0.5px solid rgba(255,255,255,.04)", cursor: "pointer" }}>
                    {expandedRow === b.id ? <ChevronDown size={11} style={{ color: "#5A5B7A", flexShrink: 0 }} /> : <ChevronRight size={11} style={{ color: "#5A5B7A", flexShrink: 0 }} />}
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: TYPE_COLOR[b.type] || "#8B8AA0", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: "#F0EFF8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</p>
                      <p style={{ fontSize: 10, color: "#5A5B7A" }}>{TYPE_LABEL[b.type] || b.type}</p>
                    </div>
                    <p style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: b.labaBulan >= 0 ? "#2DD4BF" : "#EC4899", flexShrink: 0 }}>{fmtRp(b.omzetBulan)}</p>
                  </div>
                  {expandedRow === b.id && (
                    <div style={{ background: "#070711", padding: "10px 14px", borderRadius: 8, margin: "4px 0 8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[["Omzet", fmtFull(b.omzetBulan)], ["Laba/Rugi", (b.labaBulan >= 0 ? "+" : "") + fmtFull(b.labaBulan)], ["Margin", b.margin + "%"], ["Order", String(b.totalOrderBulan)]].map(([k, v]) => (
                          <div key={k} style={{ background: "#0D0D1A", borderRadius: 7, padding: "8px 10px", border: "0.5px solid rgba(255,255,255,.05)" }}>
                            <p style={{ fontSize: 10, color: "#5A5B7A", marginBottom: 3 }}>{k}</p>
                            <p style={{ fontSize: 12, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>{v}</p>
                          </div>
                        ))}
                      </div>
                      {b.stokKritis.length > 0 && (
                        <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(245,158,11,.06)", border: "0.5px solid rgba(245,158,11,.15)", borderRadius: 7, fontSize: 10, color: "#F59E0B" }}>
                          Stok kritis: {b.stokKritis.map(p => p.name).join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {totalExpense > 0 && (
            <div style={{ ...S.card, marginBottom: 16 }}>
              <p style={S.title}>Breakdown Pengeluaran</p>
              {Object.entries(allExpenses).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 110, fontSize: 11, color: "#8B8AA0", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</div>
                  <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,.04)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: amt / totalExpense * 100 + "%", background: "linear-gradient(90deg,#2DD4BF,#8B5CF6)", borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 85, textAlign: "right", fontSize: 11, fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>{fmtFull(amt)}</div>
                </div>
              ))}
            </div>
          )}

        </div>

        <div style={{ width: 255, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600 }}>Perlu Perhatian</p>
              <span style={{ fontSize: 10, color: "#2DD4BF" }}>{visibleAlerts.length} alert</span>
            </div>
            {visibleAlerts.length === 0 && <p style={{ fontSize: 11, color: "#3A3B52", textAlign: "center", padding: "10px 0" }}>Semua aman ✓</p>}
            {visibleAlerts.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "0.5px solid rgba(255,255,255,.04)" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(236,72,153,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle size={11} style={{ color: "#EC4899" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: "#F0EFF8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
                  <p style={{ fontSize: 10, color: "#5A5B7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.sub}</p>
                </div>
                <button onClick={() => router.push("/dashboard/inventory")} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(236,72,153,.1)", color: "#EC4899", border: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Lihat</button>
                <button onClick={() => setDismissedAlerts(prev => [...prev, a.id])} style={{ background: "none", border: "0.5px solid rgba(255,255,255,.08)", color: "#5A5B7A", borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <p style={S.title}>Kontribusi Per Bisnis</p>
            {totalOmzet > 0 ? (
              <>
                <PieChart width={223} height={110}>
                  <Pie data={donutData} cx={111} cy={55} innerRadius={34} outerRadius={50} dataKey="value" paddingAngle={2}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => fmtFull(Number(v))} contentStyle={{ background: "#0D0D1A", border: "0.5px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
                {businesses.map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "0.5px solid rgba(255,255,255,.04)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: TYPE_COLOR[b.type] || "#8B8AA0", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 10, color: "#8B8AA0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                    <span style={{ fontSize: 10, color: "#5A5B7A", marginRight: 6 }}>{totalOmzet > 0 ? Math.round(b.omzetBulan / totalOmzet * 100) : 0}%</span>
                    <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#F0EFF8" }}>{fmtRp(b.omzetBulan)}</span>
                  </div>
                ))}
              </>
            ) : <p style={{ fontSize: 11, color: "#3A3B52", textAlign: "center", padding: "20px 0" }}>Belum ada omzet</p>}
          </div>

          <div style={{ background: "linear-gradient(135deg,rgba(45,212,191,.08),rgba(139,92,246,.04))", border: "0.5px solid rgba(45,212,191,.2)", borderRadius: 13, padding: 14 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, padding: "2px 7px", borderRadius: 5, background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", color: "#070711", fontWeight: 700, marginBottom: 10 }}>
              Insight AI ❖ Baru
            </div>
            {topGrowth && (
              <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#8B8AA0", lineHeight: 1.5, marginBottom: 7 }}>
                <span style={{ color: "#2DD4BF", flexShrink: 0 }}>✓</span>
                <span><strong style={{ color: "#F0EFF8" }}>{topGrowth.name}</strong> {topGrowth.growthPct >= 0 ? "tumbuh" : "turun"} {Math.abs(topGrowth.growthPct)}% dibanding periode lalu.</span>
              </div>
            )}
            {visibleAlerts.length > 0 && (
              <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#8B8AA0", lineHeight: 1.5, marginBottom: 7 }}>
                <span style={{ color: "#EC4899", flexShrink: 0 }}>⚠</span>
                <span>{visibleAlerts.length} bisnis dengan stok hampir habis. Cek segera.</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#8B8AA0", lineHeight: 1.5, marginBottom: 7 }}>
              <span style={{ color: "#2DD4BF", flexShrink: 0 }}>✓</span>
              <span>Total {businesses.length} bisnis aktif dengan {totalOrder} order bulan ini.</span>
            </div>
            <button style={{ width: "100%", background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", border: "none", borderRadius: 8, padding: 8, color: "#070711", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 6, fontFamily: "'Space Grotesk', sans-serif" }}>
              Lihat Analisis Lengkap →
            </button>
          </div>

          <div style={S.card}>
            <p style={S.title}>Target Omzet</p>
            {businesses.map(b => {
              const pct = Math.min(100, b.targetPct);
              const color = pct >= 90 ? "#2DD4BF" : pct >= 50 ? "#F59E0B" : "#EC4899";
              return (
                <div key={b.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#C4C3D4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{b.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color }}>{b.targetOmzet > 0 ? pct + "%" : "-"}</span>
                      <button onClick={() => { setEditingTarget(b.id); setTargetInput(String(b.targetOmzet)); }} style={{ background: "none", border: "0.5px solid rgba(255,255,255,.08)", borderRadius: 5, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#5A5B7A" }}>
                        <Pencil size={9} />
                      </button>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,.04)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#5A5B7A", marginTop: 3 }}>
                    <span>{fmtRp(b.omzetBulan)}</span>
                    <span>{b.targetOmzet > 0 ? fmtRp(b.targetOmzet) : "Belum diset"}</span>
                  </div>
                  {editingTarget === b.id && (
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <input type="number" value={targetInput} onChange={e => setTargetInput(e.target.value)} placeholder="Target (Rp)" style={{ flex: 1, background: "#070711", border: "0.5px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "5px 8px", fontSize: 11, color: "#F0EFF8", fontFamily: "JetBrains Mono, monospace", outline: "none" }} />
                      <button onClick={() => saveTarget(b.id)} disabled={savingTarget} style={{ background: "#2DD4BF", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#070711", cursor: "pointer" }}>{savingTarget ? "..." : "✓"}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={S.card}>
            <p style={S.title}>Ekspor Rekap</p>
            {[
              { icon: "📊", label: "Excel · semua bisnis" },
              { icon: "📄", label: "PDF · laporan bulanan" },
              { icon: "💬", label: "Kirim ke WhatsApp" },
              { icon: "⏰", label: "Jadwalkan otomatis" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? "0.5px solid rgba(255,255,255,.04)" : "none", cursor: "pointer" }}>
                <span style={{ fontSize: 11, color: "#8B8AA0" }}>{item.icon} {item.label}</span>
                <ChevronRight size={11} style={{ color: "#3A3B52" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <button style={{ flex: 1, fontSize: 11, padding: 8, borderRadius: 8, border: "0.5px solid rgba(255,255,255,.08)", background: "#161622", color: "#8B8AA0", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Preview</button>
              <button style={{ flex: 1, fontSize: 11, padding: 8, borderRadius: 8, background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", border: "none", color: "#070711", fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Unduh</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
