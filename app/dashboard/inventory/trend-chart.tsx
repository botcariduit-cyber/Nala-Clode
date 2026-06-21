"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type HistoryPoint = { snapshot_date: string; total_value: number };

export default function TrendChart({ history }: { history: HistoryPoint[] }) {
  const data = history.map((h) => ({
    date: new Date(h.snapshot_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    value: Number(h.total_value),
  }));

  const hasEnoughData = data.length >= 2;
  const isUp = hasEnoughData ? data[data.length - 1].value >= data[0].value : true;

  return (
    <div className="relative bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6 overflow-hidden">
      <div className="absolute w-72 h-72 rounded-full -top-20 -right-20 pointer-events-none" style={{ background: isUp ? "#2DD4BF" : "#EC4899", filter: "blur(90px)", opacity: 0.15 }} />
      <div className="relative flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">Tren Nilai Inventory</h3>
          <p className="text-xs text-[#8B8AA0]">Perkembangan nilai stok kamu dari waktu ke waktu</p>
        </div>
        {data.length > 0 && (
          <p className="font-mono text-lg font-semibold" style={{ color: isUp ? "#2DD4BF" : "#EC4899" }}>Rp{data[data.length - 1].value.toLocaleString("id-ID")}</p>
        )}
      </div>

      {hasEnoughData ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "#2DD4BF" : "#EC4899"} stopOpacity={0.4} />
                <stop offset="100%" stopColor={isUp ? "#2DD4BF" : "#EC4899"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#8B8AA0", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#8B8AA0", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
            <Tooltip contentStyle={{ background: "#0A0A12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(value: any) => [`Rp${Number(value).toLocaleString("id-ID")}`, "Nilai"]} />
            <Area type="monotone" dataKey="value" stroke={isUp ? "#2DD4BF" : "#EC4899"} strokeWidth={2} fill="url(#trendGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[180px] flex items-center justify-center text-center px-6">
          <p className="text-sm text-[#8B8AA0]">Grafik bakal muncul setelah ada data dari beberapa hari pemakaian. Tetap pakai Gercep AI tiap hari biar trend-nya kelihatan!</p>
        </div>
      )}
    </div>
  );
}
