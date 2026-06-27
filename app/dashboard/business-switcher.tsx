"use client";
import { useState } from "react";
import { ChevronDown, Plus, Check, Store, Bird, UtensilsCrossed, Factory, Briefcase, ShoppingBag, Truck, Heart, Leaf, Wrench, Building2 } from "lucide-react";
import { switchBusiness, addNewBusiness, deleteBusiness } from "../actions/business";

type Business = { id: string; name: string; type: string | null };

const typeIcon: Record<string, typeof Store> = {
  retail: Store,
  ternak: Bird,
  kuliner: UtensilsCrossed,
  homeindustry: Factory,
  jasa: Briefcase,
  olshop: ShoppingBag,
  wholesale: Truck,
  kesehatan: Heart,
  pertanian: Leaf,
  bengkel: Wrench,
};

const typeColor: Record<string, string> = {
  retail: "#38BDF8",
  ternak: "#2DD4BF",
  kuliner: "#F59E0B",
  homeindustry: "#8B5CF6",
  jasa: "#EC4899",
  olshop: "#F43F5E",
  wholesale: "#6366F1",
  kesehatan: "#10B981",
  pertanian: "#84CC16",
  bengkel: "#EF4444",
};

export default function BusinessSwitcher({ businesses, activeBusiness }: { businesses: Business[]; activeBusiness: Business | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const Icon = typeIcon[activeBusiness?.type || ""] || Building2;
  const color = typeColor[activeBusiness?.type || ""] || "#8B8AA0";

  return (
    <div className="relative px-3 pb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}25` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-medium truncate">{activeBusiness?.name || "Pilih Bisnis"}</p>
          <p className="text-[10px] text-[#8B8AA0] capitalize">{activeBusiness?.type || "—"}</p>
        </div>
        <ChevronDown size={14} className={"text-[#8B8AA0] transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#0F0F1A] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-[10px] text-[#8B8AA0] font-medium tracking-wide uppercase">Bisnis kamu</p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {businesses.map((b) => {
                const BIcon = typeIcon[b.type || ""] || Building2;
                const bColor = typeColor[b.type || ""] || "#8B8AA0";
                const isActive = b.id === activeBusiness?.id;
                return (
                  <div key={b.id} className={"flex items-center gap-1 hover:bg-white/5 transition-colors " + (isActive ? "bg-white/5" : "")}>
                    <button
                      disabled={loading === b.id}
                      onClick={async () => {
                        setLoading(b.id);
                        setOpen(false);
                        await switchBusiness(b.id);
                      }}
                      className="flex-1 flex items-center gap-3 px-3 py-2.5"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${bColor}25` }}>
                        <BIcon size={13} style={{ color: bColor }} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-medium truncate">{b.name}</p>
                        <p className="text-[10px] text-[#8B8AA0] capitalize">{b.type || "—"}</p>
                      </div>
                      {isActive && <Check size={13} className="text-[#2DD4BF] flex-shrink-0" />}
                    </button>
                    {!isActive && (
                      <button
                        disabled={deleting === b.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Hapus bisnis "${b.name}"? Semua produk akan ikut terhapus.`)) return;
                          setDeleting(b.id);
                          await deleteBusiness(b.id);
                        }}
                        className="pr-3 text-[#8B8AA0] hover:text-[#EC4899] transition-colors"
                        title="Hapus bisnis"
                      >
                        {deleting === b.id ? "..." : "✕"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-white/5">
              <button
                onClick={async () => { setOpen(false); await addNewBusiness(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-[#2DD4BF]"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#2DD4BF]/10">
                  <Plus size={13} className="text-[#2DD4BF]" />
                </div>
                <p className="text-xs font-medium">Tambah bisnis baru</p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
