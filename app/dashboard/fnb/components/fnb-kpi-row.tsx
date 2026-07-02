"use client";

type Kpi = { label: string; value: string; color: string; sub?: string };

export default function FnbKpiRow({ items }: { items: Kpi[] }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(k => (
        <div
          key={k.label}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0F0F1A]/80 p-4 backdrop-blur-sm"
        >
          <div
            className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl"
            style={{ background: k.color }}
          />
          <p className="relative mb-1 text-[10px] font-medium uppercase tracking-wide text-[#8B8AA0]">{k.label}</p>
          <p className="relative font-mono text-lg font-bold" style={{ color: k.color }}>{k.value}</p>
          {k.sub && <p className="relative mt-0.5 text-[10px] text-[#5A5B7A]">{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}
