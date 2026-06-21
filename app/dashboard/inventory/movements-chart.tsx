"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Movement = { type: string; quantity: number; created_at: string };

export default function MovementsChart({ movements }: { movements: Movement[] }) {
  if (!movements || movements.length === 0) return null;

  const grouped: Record<string, { date: string; masuk: number; keluar: number }> = {};
  movements.forEach((m) => {
    const date = new Date(m.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (!grouped[date]) grouped[date] = { date, masuk: 0, keluar: 0 };
    if (m.type === "masuk") grouped[date].masuk += m.quantity;
    else grouped[date].keluar += m.quantity;
  });
  const data = Object.values(grouped).reverse();

  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6">
      <h3 className="text-sm font-medium mb-4">Grafik Barang Masuk vs Keluar</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={6} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#8B8AA0", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8B8AA0", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#0A0A12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8B8AA0" }} />
          <Bar dataKey="masuk" name="Masuk" fill="#2DD4BF" radius={[6, 6, 0, 0]} maxBarSize={48} />
          <Bar dataKey="keluar" name="Keluar" fill="#EC4899" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
