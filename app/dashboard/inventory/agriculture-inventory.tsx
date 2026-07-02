"use client";
import Link from "next/link";
import { Sprout, MessageCircle, ArrowRight } from "lucide-react";
import type { Product, HarvestMeta, SaprotanMeta } from "../pertanian/lib/types";
import { cardCls, fmtRp, isHarvestCategory, isSaprotanCategory } from "../pertanian/lib/constants";

type Props = {
  products: Product[];
  harvestMeta: HarvestMeta[];
  saprotanMeta: SaprotanMeta[];
  userId: string;
  businessId?: string;
};

export default function AgricultureInventory({ products, harvestMeta }: Props) {
  const harvest = products.filter(p => isHarvestCategory(p.category));
  const saprotan = products.filter(p => isSaprotanCategory(p.category));
  const totalPanen = harvest.reduce((s, p) => s + (p.price || 0) * p.stock, 0);

  return (
    <div className="space-y-4 mb-8">
      <Link href="/dashboard/pertanian"
        className={`block ${cardCls} p-5 border-emerald-500/25 bg-gradient-to-br from-emerald-600/15 to-violet-600/10 active:scale-[0.99] transition-transform`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <Sprout size={24} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">Buka Pertanian</h2>
            <p className="text-xs text-[#8B8AA0]">Catat panen & pupuk — 2 tap saja</p>
          </div>
          <ArrowRight size={20} className="text-emerald-400" />
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/chat?context=pertanian" onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white">
            <MessageCircle size={16} /> Tanya AI
          </Link>
          <span className="flex-1 flex items-center justify-center py-3 rounded-xl border border-white/10 text-sm text-[#8B8AA0]">
            {harvest.length} panen · {saprotan.length} saprotan
          </span>
        </div>
      </Link>

      {(harvest.length > 0 || saprotan.length > 0) && (
        <div className={`${cardCls} p-4`}>
          <p className="text-xs text-[#8B8AA0] mb-2">Ringkasan cepat</p>
          {harvest.length > 0 && (
            <p className="text-sm">🌾 Nilai panen: <span className="text-emerald-400 font-mono">{fmtRp(totalPanen)}</span></p>
          )}
          {saprotan.filter(p => p.stock <= p.min_stock).length > 0 && (
            <p className="text-sm text-amber-400 mt-1">⚠ Ada saprotan yang menipis</p>
          )}
        </div>
      )}
    </div>
  );
}
