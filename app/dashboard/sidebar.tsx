"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Wallet, Store, MessageCircle, Package, Factory, Bird, Calculator, ShoppingCart, Users, Megaphone, BarChart3, Camera, QrCode, Receipt, FileText, Layers, Percent, Smartphone, Gauge, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import BusinessSwitcher from "./business-switcher";

const baseModules = [
  { name: "Dashboard Owner", href: "/dashboard/owner", icon: Gauge, label: "MENU UTAMA" },
  { name: "Gercep Chat", href: "/dashboard/chat", icon: MessageCircle },
  { name: "Keuangan Bisnis", href: "/dashboard/keuangan-bisnis", icon: Store },
  { name: "Keuangan Pribadi", href: "/dashboard/keuangan-pribadi", icon: Wallet },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package, label: "MANAJEMEN" },
  { name: "Produksi", href: "/dashboard/produksi", icon: Factory },
];

const ternak_modules = [
  { name: "Manajemen Ternak", href: "/dashboard/peternakan", icon: Bird },
];

const fnb_modules = [
  { name: "Master Menu", href: "/dashboard/fnb/menu", icon: Receipt },
  { name: "Kasir", href: "/dashboard/fnb/kasir", icon: ShoppingCart },
  { name: "Karyawan", href: "/dashboard/fnb/karyawan", icon: Users },
];

const comingSoonModules = [
  { name: "Smart Profit Calculator", icon: Calculator },
  { name: "CRM Pelanggan", icon: Users },
  { name: "AI Marketing", icon: Megaphone },
  { name: "AI Riset Bisnis", icon: BarChart3 },
  { name: "Barcode QR Analyzer", icon: QrCode },
  { name: "Pajak NPWP Center", icon: FileText },
  { name: "Multi Platform", icon: Smartphone },
];

type Business = { id: string; name: string; type: string | null };

export default function Sidebar({ expanded, setExpanded, businesses, activeBusiness, userName, onNavigate }: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  businesses: Business[];
  activeBusiness: Business | null;
  userName?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const allModules = [
    ...baseModules,
    ...(activeBusiness?.type === "ternak" ? ternak_modules : []),
    ...(activeBusiness?.type === "kuliner" ? fnb_modules : []),
  ];

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-50 overflow-hidden"
      style={{
        width: expanded ? 220 : 64,
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        background: "#0D0D1A",
        borderRight: "0.5px solid rgba(255,255,255,.06)",
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="absolute w-48 h-48 rounded-full opacity-10 blur-[60px] -top-16 -left-16 pointer-events-none" style={{ background: "radial-gradient(circle, #2DD4BF, transparent)" }} />

      <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,.06)", height: 60, flexShrink: 0 }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: "linear-gradient(135deg, #2DD4BF, #8B5CF6)", color: "#070711" }}>G</div>
        {expanded && <span className="font-bold text-sm whitespace-nowrap" style={{ color: "#F0EFF8" }}>GERCEP <span style={{ background: "linear-gradient(135deg, #2DD4BF, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span></span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: "none" }}>
        {allModules.map((m, i) => {
          const isActive = pathname === m.href;
          const showLabel = expanded && "label" in m && m.label;
          return (
            <div key={m.href}>
              {showLabel && (
                <p className="text-[9px] font-semibold px-2 mt-3 mb-1.5 whitespace-nowrap" style={{ color: "#3A3B52", letterSpacing: ".08em" }}>{m.label}</p>
              )}
              <a
                href={m.href}
                onClick={() => onNavigate?.()}
                title={m.name}
                className="flex items-center gap-2.5 rounded-lg mb-0.5 transition-all"
                style={{
                  padding: expanded ? "7px 10px" : "7px",
                  justifyContent: expanded ? "flex-start" : "center",
                  background: isActive ? "linear-gradient(135deg, rgba(45,212,191,.12), rgba(139,92,246,.08))" : "transparent",
                  border: isActive ? "0.5px solid rgba(45,212,191,.2)" : "0.5px solid transparent",
                  color: isActive ? "#2DD4BF" : "#5A5B7A",
                  display: "flex",
                }}
              >
                <m.icon size={15} style={{ flexShrink: 0 }} />
                {expanded && <span className="text-xs whitespace-nowrap font-medium" style={{ marginLeft: 10 }}>{m.name}</span>}
              </a>
            </div>
          );
        })}

        {expanded && comingSoonModules.length > 0 && (
          <p className="text-[9px] font-semibold px-2 mt-4 mb-1.5 whitespace-nowrap" style={{ color: "#3A3B52", letterSpacing: ".08em" }}>SEGERA HADIR</p>
        )}
        {comingSoonModules.map(m => (
          <div
            key={m.name}
            title={m.name}
            className="flex items-center gap-2.5 rounded-lg mb-0.5"
            style={{
              padding: expanded ? "7px 10px" : "7px",
              justifyContent: expanded ? "flex-start" : "center",
              color: "rgba(90,91,122,.4)",
              cursor: "not-allowed",
            }}
          >
            <m.icon size={15} style={{ flexShrink: 0 }} />
            {expanded && <span className="text-xs whitespace-nowrap">{m.name}</span>}
          </div>
        ))}
      </nav>

      {expanded && (
        <div className="mx-2 mb-2 rounded-xl p-3" style={{ background: "linear-gradient(135deg, rgba(45,212,191,.08), rgba(139,92,246,.06))", border: "0.5px solid rgba(45,212,191,.15)" }}>
          <p className="text-xs font-semibold mb-0.5" style={{ color: "#2DD4BF" }}>🚀 Upgrade ke Pro</p>
          <p className="text-[10px] mb-2.5 leading-relaxed" style={{ color: "#5A5B7A" }}>Akses semua fitur premium tanpa batas</p>
          <button className="w-full rounded-lg py-1.5 text-[11px] font-bold border-none cursor-pointer" style={{ background: "linear-gradient(135deg, #2DD4BF, #8B5CF6)", color: "#070711", fontFamily: "'Space Grotesk', sans-serif" }}>Upgrade Sekarang</button>
        </div>
      )}

      {expanded && <BusinessSwitcher businesses={businesses} activeBusiness={activeBusiness} />}

      <div className="px-2 py-3 flex-shrink-0" style={{ borderTop: "0.5px solid rgba(255,255,255,.06)" }}>
        {expanded ? (
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #2DD4BF, #8B5CF6)", color: "#070711" }}>
              {userName ? userName[0].toUpperCase() : "M"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "#F0EFF8" }}>{userName || "Mahendra"}</p>
              <p className="text-[10px]" style={{ color: "#5A5B7A" }}>Owner</p>
            </div>
            <a href="/dashboard/onboarding" className="ml-auto text-[10px] hover:text-[#EC4899] transition-colors" style={{ color: "#5A5B7A" }}>Keluar</a>
          </div>
        ) : (
          <div className="flex justify-center">
            <a href="/dashboard/onboarding" title="Keluar" className="text-xs hover:text-[#EC4899] transition-colors" style={{ color: "#5A5B7A" }}>↩</a>
          </div>
        )}
      </div>
    </aside>
  );
}
