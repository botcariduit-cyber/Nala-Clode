import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import { Wallet, Store, MessageCircle, Package, Calculator, ShoppingCart, Users, Megaphone, BarChart3, Camera, QrCode, Receipt, FileText, Layers, Percent, Smartphone, Gauge } from "lucide-react";

const activeModules = [
  { name: "Gercep Chat", href: "/dashboard/chat", icon: MessageCircle },
  { name: "Keuangan Pribadi", href: "/dashboard/keuangan-pribadi", icon: Wallet },
  { name: "Keuangan Bisnis", href: "/dashboard/keuangan-bisnis", icon: Store },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package },
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0A0A12] text-[#F2F1F8] flex">
      <aside className="w-[260px] flex-shrink-0 border-r border-white/5 flex flex-col h-screen sticky top-0 relative overflow-hidden">
        <div
          className="absolute w-64 h-64 rounded-full opacity-15 blur-[80px] -top-20 -left-20 pointer-events-none"
          style={{ background: "linear-gradient(135deg, #38BDF8, #8B5CF6, #EC4899)" }}
        />

        <div className="px-5 py-5 border-b border-white/5 relative">
          <span className="font-semibold text-lg">Gercep<span className="holo-text">AI</span></span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 relative">
          <p className="text-[10px] text-[#2DD4BF] tracking-wide px-2 mb-2 font-medium">MODUL AKTIF</p>
          <div className="flex flex-col gap-1 mb-6">
            {activeModules.map((m) => (
              <a key={m.href} href={m.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#F2F1F8] hover:bg-white/5 transition-colors">
                <m.icon size={16} className="text-[#8B8AA0]" />
                {m.name}
              </a>
            ))}
          </div>

          <p className="text-[10px] text-[#8B8AA0] tracking-wide px-2 mb-2 font-medium">SEGERA HADIR</p>
          <div className="flex flex-col gap-1">
            {comingSoonModules.map((m) => (
              <div key={m.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8B8AA0]/40 cursor-not-allowed">
                <m.icon size={16} />
                {m.name}
              </div>
            ))}
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-white/5 relative">
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
