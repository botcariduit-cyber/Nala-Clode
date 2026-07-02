"use client";
import { useMemo } from "react";
import type { AgriDashboardData } from "../lib/types";
import { cardCls } from "../lib/constants";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function ActivityCalendar({ data }: { data: AgriDashboardData }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const events = useMemo(() => {
    const map: Record<string, { label: string; color: string }[]> = {};
    const add = (date: string, label: string, color: string) => {
      if (!map[date]) map[date] = [];
      map[date].push({ label, color });
    };
    data.fields.filter(f => f.tanggal_tanam).forEach(f => add(f.tanggal_tanam!, `Tanam: ${f.nama_lahan}`, "#8b5cf6"));
    data.harvestMeta.filter(m => m.tanggal_panen).forEach(m => {
      const p = data.products.find(pr => pr.id === m.product_id);
      add(m.tanggal_panen!, `Panen: ${p?.name || "—"}`, "#2dd4bf");
    });
    data.spraying.forEach(s => add(s.tanggal, `Semprot: ${s.nama_produk}`, "#38bdf8"));
    data.costs.forEach(c => add(c.tanggal, `Biaya: ${c.kategori}`, "#f59e0b"));
    data.saprotanMeta.filter(m => m.tanggal_kadaluarsa).forEach(m => {
      const p = data.products.find(pr => pr.id === m.product_id);
      add(m.tanggal_kadaluarsa!, `Kadaluarsa: ${p?.name || "—"}`, "#ec4899");
    });
    return map;
  }, [data]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className={`${cardCls} p-4`}>
      <h4 className="text-sm font-medium mb-3">Kalender Aktivitas — {monthName}</h4>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] text-[#5A5B7A] py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const evts = events[key] || [];
          const isToday = day === now.getDate();
          return (
            <div key={key} className={`min-h-[52px] rounded-lg p-1 border ${isToday ? "border-violet-500/40 bg-violet-500/10" : "border-white/[0.04] bg-[#0A0A12]/50"}`}>
              <p className={`text-[10px] mb-0.5 ${isToday ? "text-violet-300 font-bold" : "text-[#8B8AA0]"}`}>{day}</p>
              {evts.slice(0, 2).map((e, j) => (
                <div key={j} className="text-[8px] truncate rounded px-0.5 mb-0.5" style={{ background: `${e.color}22`, color: e.color }} title={e.label}>{e.label}</div>
              ))}
              {evts.length > 2 && <p className="text-[8px] text-[#5A5B7A]">+{evts.length - 2}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
