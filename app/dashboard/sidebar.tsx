"use client";
import { Wallet, Store, MessageCircle, Package, Factory, Calculator, ShoppingCart, Users, Megaphone, BarChart3, Camera, QrCode, Receipt, FileText, Layers, Percent, Smartphone, Gauge } from "lucide-react";
import BusinessSwitcher from "./business-switcher";

const activeModules = [
  { name: "Gercep Chat", href: "/dashboard/chat", icon: MessageCircle },
  { name: "Keuangan Pribadi", href: "/dashboard/keuangan-pribadi", icon: Wallet },
  { name: "Keuangan Bisnis", href: "/dashboard/keuangan-bisnis", icon: Store },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package },
  { name: "Produksi", href: "/dashboard/produksi", icon: Factory },
];

const comingSoonModules = [
  { name: "Dashboard Owner", icon: Gauge },
  { name: "Smart Profit Calculator", icon: Calculator },
  { name: "Marketplace Center", icon: ShoppingCart },
  { name: "CRM Pelanggan", icon: Users },
  { name: "AI Marketing", icon: Megaphone },
  { name: "AI Riset Bisnis", icon: BarChart3 },
  { name: "AI Jual Beli", icon: Camera },
  { name: "Barcode QR Analyzer", icon: QrCode },
  { name: "AI Kasir", icon: Receipt },
  { name: "Pajak NPWP Center", icon: FileText },
  { name: "Multi Bisnis", icon: Layers },
  { name: "Tim dan Komisi Karyawan", icon: Percent },
  { name: "Multi Platform", icon: Smartphone },
];

type Business = { id: string; name: string; type: string | null };

export default function Sidebar({ expanded, setExpanded, businesses, activeBusiness, onNavigate }: { 
  expanded: boolean; 
  setExpanded: (v: boolean) => void;
  businesses: Business[];
  activeBusiness: Business | null;
  onNavigate?: () => void;
}) {
  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="fixed top-0 left-0 h-screen border-r border-white/5 flex flex-col z-50 overflow-hidden bg-[#0A0A12]"
      style={{ width: expanded ? 260 : 72, transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)" }}
    >
      <div
        className="absolute w-64 h-64 rounded-full opacity-15 blur-[80px] -top-20 -left-20 pointer-events-none"
        style={{ background: "linear-gradient(135deg, #38BDF8, #8B5CF6, #EC4899)" }}
      />

      <div className="px-5 py-5 border-b border-white/5 relative flex items-center" style={{ height: 64 }}>
        {expanded ? (
          <span className="font-semibold text-lg whitespace-nowrap">Gercep<span className="holo-text">AI</span></span>
        ) : (
          <span className="font-semibold text-lg w-full text-center">G</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 relative">
        {expanded && <p className="text-[10px] text-[#2DD4BF] tracking-wide px-2 mb-2 font-medium whitespace-nowrap">MODUL AKTIF</p>}
        <div className="flex flex-col gap-1 mb-6">
          {activeModules.map((m) => (
            <a key={m.href} href={m.href} title={m.name} onClick={() => onNavigate?.()} className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#F2F1F8] hover:bg-white/5 transition-colors whitespace-nowrap " + (expanded ? "" : "justify-center")}>
              <m.icon size={16} className="text-[#8B8AA0] flex-shrink-0" />
              {expanded && m.name}
            </a>
          ))}
        </div>

        {expanded && <p className="text-[10px] text-[#8B8AA0] tracking-wide px-2 mb-2 font-medium whitespace-nowrap">SEGERA HADIR</p>}
        <div className="flex flex-col gap-1">
          {comingSoonModules.map((m) => (
            <div key={m.name} title={m.name} className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8B8AA0]/40 cursor-not-allowed whitespace-nowrap " + (expanded ? "" : "justify-center")}>
              <m.icon size={16} className="flex-shrink-0" />
              {expanded && m.name}
            </div>
          ))}
        </div>
      </nav>

      {expanded && (
        <BusinessSwitcher businesses={businesses} activeBusiness={activeBusiness} />
      )}

      <div className="px-3 py-4 border-t border-white/5 relative">
        <div className={"flex " + (expanded ? "justify-start px-2" : "justify-center")}>
          <a href="/dashboard/onboarding" title="Logout" className="text-xs text-[#8B8AA0] hover:text-[#EC4899] transition-colors">
            {expanded ? "Keluar" : "↩"}
          </a>
        </div>
      </div>
    </aside>
  );
}
