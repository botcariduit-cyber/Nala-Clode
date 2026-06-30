"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, ChevronDown, ChevronRight, X, Pencil, Lightbulb, AlertTriangle, Clock, TrendingUp, TrendingDown, Printer, Plus, FileSpreadsheet, FileText, Download, Eye } from "lucide-react";

type Business = {
  id: string; name: string; type: string;
  omzetBulan: number; labaBulan: number; omzetBulanLalu: number; omzetTahun: number; growthPct: number;
  totalOrderBulan: number; stokKritis: { id: string; name: string; stock: number; min_stock: number }[];
  pengeluaranByCategory: Record<string, number>;
  targetOmzet: number; targetPct: number; margin: number;
};

const TYPE_COLOR: Record<string, string> = { kuliner: "#34D399", ternak: "#60A5FA", homeindustry: "#FBBF24", retail: "#A78BFA" };
const TYPE_LABEL: Record<string, string> = { kuliner: "F&B / Kuliner", ternak: "Peternakan", homeindustry: "Home industri", retail: "Retail" };

function fmtRp(n: number) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

export default function DashboardOwnerClient({ businesses, bulan, tahun, userId }: { businesses: Business[]; bulan: number; tahun: number; userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [targetInput, setTargetInput] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const totalOmzet = businesses.reduce((s, b) => s + b.omzetBulan, 0);
  const totalLaba = businesses.reduce((s, b) => s + Math.max(0, b.labaBulan), 0);
  const totalRugi = businesses.reduce((s, b) => s + Math.abs(Math.min(0, b.labaBulan)), 0);
  const totalOrder = businesses.reduce((s, b) => s + b.totalOrderBulan, 0);
  const avgGrowth = businesses.length > 0 ? Math.round(businesses.reduce((s, b) => s + b.growthPct, 0) / businesses.length) : 0;

  const ranked = [...businesses].sort((a, b) => b.labaBulan - a.labaBulan);
  const topGrowth = [...businesses].sort((a, b) => b.growthPct - a.growthPct)[0];
  const lowGrowth = [...businesses].sort((a, b) => a.growthPct - b.growthPct)[0];

  const filtered = businesses.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const alerts: { id: string; biz: Business; type: "danger" | "warning"; title: string; sub: string }[] = [];
  businesses.forEach(b => {
    if (b.stokKritis.length > 0) {
      alerts.push({
        id: "stok-" + b.id, biz: b, type: "danger",
        title: b.name + " — " + b.stokKritis.length + " bahan hampir habis",
        sub: b.stokKritis.slice(0, 3).map(p => p.name).join(", "),
      });
    }
  });
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  const toggleSection = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const startEditTarget = (bizId: string, current: number) => {
    setEditingTarget(bizId);
    setTargetInput(current.toString());
  };

  const saveTarget = async (bizId: string) => {
    setSavingTarget(true);
    const value = Number(targetInput) || 0;
    await supabase.from("business_targets").upsert({
      business_id: bizId, user_id: userId, bulan, tahun, target_omzet: value,
    }, { onConflict: "business_id,bulan,tahun" });
    setSavingTarget(false);
    setEditingTarget(null);
    router.refresh();
  };

  const maxLaba = Math.max(...ranked.map(b => Math.max(0, b.labaBulan)), 1);

  const allExpenses: Record<string, number> = {};
  businesses.forEach(b => {
    Object.entries(b.pengeluaranByCategory).forEach(([cat, amt]) => {
      allExpenses[cat] = (allExpenses[cat] || 0) + amt;
    });
  });
  const totalExpense = Object.values(allExpenses).reduce((s, v) => s + v, 0);
  const expColors: Record<string, string> = { "Pembelian Bahan": "#F87171", "Bahan Baku": "#F87171", "Penjualan F&B": "#34D399", "Operasional": "#FBBF24", "Gaji": "#60A5FA", "Biaya Produksi": "#A78BFA" };

  return (
    <div className="w-full max-w-[1200px] mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-[#F4F5F7]">Dashboard owner</h1>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Ringkasan keuangan semua bisnis</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bisnis..."
              className="bg-[#11151C] border border-white/[0.08] rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-[#E4E7EC] placeholder:text-[#4B5563] outline-none w-32 sm:w-36" />
          </div>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-[#F4F5F7] text-[#0B0E14] font-semibold flex items-center gap-1.5">
            <Plus size={11} /> Bisnis
          </button>
          <button onClick={() => window.print()} className="text-xs px-3 py-1.5 rounded-lg bg-[#161B26] border border-white/[0.08] text-[#9CA3AF] flex items-center gap-1.5">
            <Printer size={11} /> Cetak
          </button>
        </div>
      </div>

      <Section title="Insight otomatis" collapsed={!!collapsed.insight} onToggle={() => toggleSection("insight")}>
        <div className="bg-gradient-to-br from-[#2563EB]/[0.08] to-[#2563EB]/[0.02] border border-[#2563EB]/20 rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/15 text-[#60A5FA] flex items-center justify-center flex-shrink-0">
            <Lightbulb size={14} />
          </div>
          <div className="text-xs text-[#C7CDD6] leading-relaxed">
            {topGrowth && <span><strong className="text-[#F4F5F7]">{topGrowth.name}</strong> {topGrowth.growthPct >= 0 ? "tumbuh" : "turun"} <span className={topGrowth.growthPct >= 0 ? "text-[#34D399] font-semibold" : "text-[#F87171] font-semibold"}>{Math.abs(topGrowth.growthPct)}%</span> dibanding bulan lalu. </span>}
            {lowGrowth && lowGrowth.id !== topGrowth?.id && <span><strong className="text-[#F4F5F7]">{lowGrowth.name}</strong> {lowGrowth.growthPct >= 0 ? "tumbuh" : "turun"} <span className={lowGrowth.growthPct >= 0 ? "text-[#34D399] font-semibold" : "text-[#F87171] font-semibold"}>{Math.abs(lowGrowth.growthPct)}%</span>. </span>}
            {alerts.length > 0 && <span>Ada {alerts.length} bisnis dengan stok hampir habis, cek di bawah.</span>}
            <div className="text-[10px] text-[#4B5563] mt-2">Berdasarkan data bulan ini dibanding bulan lalu</div>
          </div>
        </div>
      </Section>

      {visibleAlerts.length > 0 && (
        <Section title="Perlu perhatian" sub={visibleAlerts.length + " alert"} collapsed={!!collapsed.alert} onToggle={() => toggleSection("alert")}>
          <div className="flex flex-col gap-2">
            {visibleAlerts.map(a => (
              <div key={a.id} className={"flex items-center gap-3 bg-[#11151C] border rounded-r-xl rounded-l-none pl-4 pr-3 py-3 " + (a.type === "danger" ? "border-[#F87171]/20 border-l-2 border-l-[#F87171]" : "border-[#FBBF24]/20 border-l-2 border-l-[#FBBF24]")}>
                {a.type === "danger" ? <AlertTriangle size={14} className="text-[#F87171] flex-shrink-0" /> : <Clock size={14} className="text-[#FBBF24] flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#F4F5F7] font-medium truncate">{a.title}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">{a.sub}</p>
                </div>
                <button onClick={() => router.push("/dashboard/inventory")} className={"text-[11px] px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap " + (a.type === "danger" ? "bg-[#F87171]/10 text-[#F87171]" : "bg-[#FBBF24]/10 text-[#FBBF24]")}>
                  Lihat
                </button>
                <button onClick={() => setDismissedAlerts(prev => [...prev, a.id])} aria-label="Tutup" className="w-6 h-6 rounded-lg border border-white/[0.08] text-[#6B7280] flex items-center justify-center flex-shrink-0">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Ringkasan" collapsed={!!collapsed.summary} onToggle={() => toggleSection("summary")}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.06]">
          <div className="bg-gradient-to-br from-[#11151C] to-[#161B26] p-4 col-span-2 sm:col-span-1">
            <p className="text-[11px] text-[#6B7280] mb-2">Total omzet</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-[#F4F5F7]">{fmtRp(totalOmzet)}</p>
            <p className="text-[11px] text-[#34D399] mt-1.5 flex items-center gap-1"><TrendingUp size={11} />{avgGrowth}% vs bulan lalu</p>
          </div>
          <div className="bg-[#11151C] p-4">
            <p className="text-[11px] text-[#6B7280] mb-2">Total laba</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-[#34D399]">{fmtRp(totalLaba)}</p>
          </div>
          <div className="bg-[#11151C] p-4">
            <p className="text-[11px] text-[#6B7280] mb-2">Total rugi</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-[#F87171]">{fmtRp(totalRugi)}</p>
          </div>
          <div className="bg-[#11151C] p-4">
            <p className="text-[11px] text-[#6B7280] mb-2">Total order</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-[#F4F5F7]">{totalOrder}</p>
          </div>
        </div>
      </Section>

      <Section title="Target omzet bulan ini" collapsed={!!collapsed.target} onToggle={() => toggleSection("target")}>
        <div className="bg-[#11151C] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-4">
          {businesses.map(b => {
            const pct = Math.min(100, b.targetPct);
            const color = pct >= 90 ? "#34D399" : pct >= 50 ? "#FBBF24" : "#F87171";
            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#E4E7EC] font-medium">{b.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono" style={{ color }}>{b.targetOmzet > 0 ? b.targetPct + "%" : "Belum diset"}</span>
                    <button onClick={() => startEditTarget(b.id, b.targetOmzet)} aria-label="Edit target" className="w-5 h-5 rounded-md border border-white/[0.08] text-[#6B7280] flex items-center justify-center">
                      <Pencil size={9} />
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: pct + "%", background: color }}></div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-[#6B7280]">
                  <span>{fmtRp(b.omzetBulan)} tercapai</span>
                  <span>target {b.targetOmzet > 0 ? fmtRp(b.targetOmzet) : "-"}</span>
                </div>
                {editingTarget === b.id && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-white/[0.08]">
                    <input value={targetInput} onChange={e => setTargetInput(e.target.value)} type="number" placeholder="Target omzet (Rp)"
                      className="flex-1 bg-[#0B0E14] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#E4E7EC] font-mono outline-none" />
                    <button onClick={() => saveTarget(b.id)} disabled={savingTarget} className="text-[11px] px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-medium disabled:opacity-50">
                      {savingTarget ? "..." : "Simpan"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Ranking bisnis paling untung" collapsed={!!collapsed.ranking} onToggle={() => toggleSection("ranking")}>
        <div className="bg-[#11151C] border border-white/[0.06] rounded-xl p-4">
          {ranked.map((b, i) => {
            const rankColors = ["#FBBF24", "#9CA3AF", "#D97706"];
            const bg = ["rgba(251,191,36,.15)", "rgba(156,163,175,.15)", "rgba(217,119,6,.15)"];
            return (
              <div key={b.id} className={"flex items-center gap-3 py-2.5 " + (i < ranked.length - 1 ? "border-b border-white/[0.04]" : "")}>
                <div className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ width: 22, height: 22, background: bg[i] || "rgba(255,255,255,.05)", color: rankColors[i] || "#9CA3AF" }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#E4E7EC] truncate">{b.name}</span>
                    <span className="font-mono text-[#34D399] flex-shrink-0 ml-2">{b.labaBulan >= 0 ? "+" : ""}{fmtRp(b.labaBulan)}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: Math.max(0, b.labaBulan / maxLaba * 100) + "%", background: TYPE_COLOR[b.type] || "#9CA3AF" }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Performa per bisnis" sub="klik untuk detail" collapsed={!!collapsed.table} onToggle={() => toggleSection("table")}>
        <div className="bg-[#11151C] border border-white/[0.06] rounded-xl overflow-hidden">
          {filtered.map(b => (
            <div key={b.id}>
              <div onClick={() => setExpandedRow(expandedRow === b.id ? null : b.id)} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 cursor-pointer hover:bg-white/[0.02]">
                {expandedRow === b.id ? <ChevronDown size={12} className="text-[#6B7280] flex-shrink-0" /> : <ChevronRight size={12} className="text-[#6B7280] flex-shrink-0" />}
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_COLOR[b.type] || "#9CA3AF" }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#F4F5F7] truncate">{b.name}</p>
                  <p className="text-[10px] text-[#6B7280]">{TYPE_LABEL[b.type] || b.type}</p>
                </div>
                <div className="hidden sm:block text-right w-28">
                  <p className="text-xs font-mono text-[#E4E7EC]">{fmtRp(b.omzetBulan)}</p>
                </div>
                <div className="hidden sm:block text-right w-28">
                  <p className={"text-xs font-mono " + (b.labaBulan >= 0 ? "text-[#34D399]" : "text-[#F87171]")}>{b.labaBulan >= 0 ? "+" : ""}{fmtRp(b.labaBulan)}</p>
                </div>
                {b.stokKritis.length > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FBBF24]/10 text-[#FBBF24] flex-shrink-0">{b.stokKritis.length} stok kritis</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#34D399]/10 text-[#34D399] flex-shrink-0">Normal</span>
                )}
              </div>
              {expandedRow === b.id && (
                <div className="bg-[#0D1018] px-4 py-4 border-b border-white/[0.04] last:border-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                    <div className="bg-[#11151C] border border-white/[0.05] rounded-lg p-2.5">
                      <p className="text-[10px] text-[#6B7280] mb-1">Omzet bulan ini</p>
                      <p className="text-xs font-semibold font-mono">{fmtRp(b.omzetBulan)}</p>
                    </div>
                    <div className="bg-[#11151C] border border-white/[0.05] rounded-lg p-2.5">
                      <p className="text-[10px] text-[#6B7280] mb-1">Margin</p>
                      <p className="text-xs font-semibold font-mono">{b.margin}%</p>
                    </div>
                    <div className="bg-[#11151C] border border-white/[0.05] rounded-lg p-2.5">
                      <p className="text-[10px] text-[#6B7280] mb-1">Order bulan ini</p>
                      <p className="text-xs font-semibold font-mono">{b.totalOrderBulan}</p>
                    </div>
                    <div className="bg-[#11151C] border border-white/[0.05] rounded-lg p-2.5">
                      <p className="text-[10px] text-[#6B7280] mb-1">Omzet tahun ini</p>
                      <p className="text-xs font-semibold font-mono">{fmtRp(b.omzetTahun)}</p>
                    </div>
                  </div>
                  {b.stokKritis.length > 0 && (
                    <div className="bg-[#FBBF24]/[0.06] border border-[#FBBF24]/15 rounded-lg px-3 py-2 text-[11px] text-[#FBBF24]">
                      Bahan hampir habis: {b.stokKritis.map(p => p.name).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-xs text-[#4B5563] text-center py-8">Tidak ada bisnis yang cocok dengan pencarian.</p>}
        </div>
      </Section>

      {totalExpense > 0 && (
        <Section title="Breakdown pengeluaran" sub="semua bisnis" collapsed={!!collapsed.expense} onToggle={() => toggleSection("expense")}>
          <div className="bg-[#11151C] border border-white/[0.06] rounded-xl p-4">
            {Object.entries(allExpenses).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <div className="w-24 sm:w-32 text-xs text-[#9CA3AF] flex-shrink-0 truncate">{cat}</div>
                <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: (amt / totalExpense * 100) + "%", background: expColors[cat] || "#9CA3AF" }}></div>
                </div>
                <div className="w-20 sm:w-24 text-right text-xs font-mono flex-shrink-0">{fmtRp(amt)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Ekspor rekap" collapsed={!!collapsed.recap} onToggle={() => toggleSection("recap")}>
        <div className="bg-[#11151C] border border-white/[0.06] rounded-xl p-4">
          {[
            { icon: FileSpreadsheet, color: "#60A5FA", label: "Excel · semua bisnis, periode terpilih" },
            { icon: FileText, color: "#F87171", label: "PDF · laporan laba rugi bulanan" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0 cursor-pointer">
              <div className="flex items-center gap-2.5 text-xs text-[#9CA3AF]">
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: item.color + "1a", color: item.color }}>
                  <item.icon size={11} />
                </div>
                {item.label}
              </div>
              <ChevronRight size={12} className="text-[#6B7280]" />
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 text-[11px] py-2 rounded-lg border border-white/[0.08] bg-[#161B26] text-[#9CA3AF] flex items-center justify-center gap-1.5">
              <Eye size={11} /> Preview
            </button>
            <button className="flex-1 text-[11px] py-2 rounded-lg bg-[#2563EB] text-white flex items-center justify-center gap-1.5">
              <Download size={11} /> Unduh rekap
            </button>
          </div>
        </div>
      </Section>

    </div>
  );
}

function Section({ title, sub, children, collapsed, onToggle }: { title: string; sub?: string; children: React.ReactNode; collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="mb-4">
      <div onClick={onToggle} className="flex items-center justify-between mb-2.5 cursor-pointer select-none">
        <span className="text-[13px] font-semibold text-[#E4E7EC] flex items-center gap-2">
          {title}
          {sub && <span className="text-[11px] text-[#6B7280] font-normal">{sub}</span>}
        </span>
        <ChevronDown size={12} className={"text-[#6B7280] transition-transform " + (collapsed ? "-rotate-90" : "")} />
      </div>
      {!collapsed && children}
    </div>
  );
}
