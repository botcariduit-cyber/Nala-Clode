"use client";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, Package, Mic, BarChart3, Users, Megaphone,
  Bot, Sparkles, Zap, ChevronDown,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard/owner", icon: LayoutDashboard },
  { name: "Keuangan", href: "/dashboard/keuangan-bisnis", icon: Wallet },
  { name: "Stok & Barang", href: "/dashboard/inventory", icon: Package },
  { name: "AI Voice", href: "/dashboard/chat", icon: Mic },
  { name: "Riset & Analitik", href: "/dashboard/owner", icon: BarChart3, badge: "Sekarang", badgeColor: "purple" },
  { name: "CRM", href: "/dashboard/keuangan-bisnis", icon: Users, disabled: true },
  { name: "Marketing", href: "/dashboard/keuangan-bisnis", icon: Megaphone, disabled: true },
  { name: "Agen AI", href: "/dashboard/chat", icon: Bot },
  { name: "Insight AI", href: "/dashboard/owner", icon: Sparkles, badge: "Baru", badgeColor: "violet" },
];

export default function Sidebar({ userName, onNavigate, embedded }: {
  userName?: string;
  onNavigate?: () => void;
  embedded?: boolean;
}) {
  const pathname = usePathname();
  const displayName = userName || "Mahendra";

  return (
    <aside className={[
      "flex h-screen w-64 flex-col border-r border-white/[0.06] bg-[#111827]",
      embedded ? "relative" : "fixed top-0 left-0 z-50",
    ].join(" ")}>
      {/* Logo */}
      <div className="flex h-[60px] flex-shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="text-sm font-bold tracking-wide text-white">
          GERCEP <span className="holo-text">AI</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" style={{ scrollbarWidth: "none" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/dashboard/owner" && pathname.startsWith("/dashboard/owner"));
          const isDisabled = item.disabled;

          return (
            <a
              key={item.name}
              href={isDisabled ? "#" : item.href}
              onClick={(e) => {
                if (isDisabled) { e.preventDefault(); return; }
                onNavigate?.();
              }}
              className={[
                "group mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : isDisabled
                    ? "cursor-not-allowed text-slate-600 opacity-50"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              ].join(" ")}
            >
              <item.icon
                size={16}
                className={isActive ? "text-white" : "text-violet-400 group-hover:text-violet-300"}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {item.badge && (
                <span className={[
                  "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  item.badgeColor === "purple"
                    ? "bg-violet-500/20 text-violet-300"
                    : "bg-indigo-500/20 text-indigo-300",
                ].join(" ")}>
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="mx-3 mb-3 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/15 to-indigo-600/10 p-4">
        <p className="mb-1 text-xs font-semibold text-violet-300">🚀 Premium Upgrade</p>
        <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
          Akses semua fitur premium tanpa batas
        </p>
        <button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-[11px] font-bold text-white transition-opacity hover:opacity-90">
          Upgrade Sekarang
        </button>
      </div>

      {/* Profile */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-white/[0.03]">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
            {displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="text-[11px] text-slate-500">Owner</p>
          </div>
          <ChevronDown size={14} className="flex-shrink-0 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
