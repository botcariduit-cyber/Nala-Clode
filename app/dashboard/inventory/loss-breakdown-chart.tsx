"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { RotateCcw, AlertOctagon, HelpCircle } from "lucide-react";

type Movement = { reason: string | null; profit_loss: number };

const reasonInfo: Record<string, { label: string; icon: typeof RotateCcw; color: string }> = {
  retur: { label: "Retur", icon: RotateCcw, color: "#EC4899" },
  rusak: { label: "Rusak/Hilang", icon: AlertOctagon, color: "#F59E0B" },
  lainnya: { label: "Lainnya", icon: HelpCircle, color: "#8B5CF6" },
};

export default function LossBreakdownChart({ movements }: { movements: Movement[] }) {
  const losses = movements.filter((m) => Number(m.profit_loss) < 0);
  if (losses.length === 0) return null;

  const grouped: Record<string, number> = {};
  losses.forEach((m) => {
    const key = m.reason || "lainnya";
    grouped[key] = (grouped[key] || 0) + Math.abs(Number(m.profit_loss));
  });

  const data = Object.entries(grouped).map(([reason, value]) => ({ reason, value, ...reasonInfo[reason] })).sort((a, b) => b.value - a.value);
  const totalLoss = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="relative bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6 overflow-hidden">
      <div className="absolute w-40 h-40 rounded-full -top-12 -right-12" style={{ background: "#EC4899", filter: "blur(60px)", opacity: 0.15 }} />
      <div className="relative flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Sumber Kerugian</h3>
        <p className="font-mono text-lg font-bold text-[#EC4899]">-Rp{totalLoss.toLocaleString("id-ID")}</p>
      </div>
      <div className="relative grid sm:grid-cols-[1fr_160px] gap-4 items-center">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#8B8AA0", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} />
            <YAxis type="category" dataKey="label" tick={{ fill: "#8B8AA0", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={{ background: "#0A0A12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`Rp${value.toLocaleString("id-ID")}`, "Rugi"]} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2.5">
          {data.map((d) => {
            const pct = totalLoss > 0 ? (d.value / totalLoss) * 100 : 0;
            return (
              <div key={d.reason} className="flex items-center gap-2">
                <d.icon size={13} style={{ color: d.color }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#F2F1F8] truncate">{d.label} <span className="text-[#8B8AA0]">({pct.toFixed(0)}%)</span></p>
                  <p className="text-[10px] font-mono" style={{ color: d.color }}>Rp{d.value.toLocaleString("id-ID")}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
