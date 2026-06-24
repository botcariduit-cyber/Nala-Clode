"use client";
import { useState, useMemo } from "react";
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import DeleteTransactionButton from "../delete-transaction-button";
import EditProductModal from "./edit-product-modal";
import StockMovementModal from "./stock-movement-modal";
import ImportExportButtons from "./import-export-buttons";
import type { BusinessConfig } from "./business-config";

type Product = { id: string; name: string; sku: string | null; stock: number; min_stock: number; price: number | null; cost: number | null; category: string | null; photo_url: string | null };

const PAGE_SIZE = 8;

export default function ProductList({ products, userId, businessId, config }: { products: Product[]; userId: string; businessId?: string; config: BusinessConfig }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
    return ["Semua", ...Array.from(set)];
  }, [products]);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "Semua" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl overflow-hidden h-fit">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-medium flex-shrink-0">Daftar {config.produkLabel}</h2>
        <div className="flex items-center gap-2">
          <ImportExportButtons products={products} userId={userId} businessId={businessId} />
          <a href="/dashboard/chat" className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-medium">+ Chat</a>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-white/10 flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8AA0]" />
          <input type="text" placeholder={`Cari nama atau SKU...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {paginated.length > 0 ? (
        <>
          <div className="divide-y divide-white/5">
            {paginated.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36, overflow: "hidden" }} className="rounded-lg bg-gradient-to-br from-[#38BDF8]/20 to-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : <Package size={16} className="text-[#8B8AA0]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.sku && <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#2DD4BF]/10 px-1.5 py-0.5 rounded">{p.sku}</span>}
                      {p.category && <span className="text-[10px] text-[#8B8AA0] bg-white/5 px-1.5 py-0.5 rounded">{p.category}</span>}
                    </div>
                    <p className="text-xs text-[#8B8AA0]">
                      {p.price ? `Jual Rp${Number(p.price).toLocaleString("id-ID")}` : "Harga belum diset"}
                      {p.cost ? ` · Modal Rp${Number(p.cost).toLocaleString("id-ID")}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={"font-mono font-semibold text-sm " + (p.stock <= p.min_stock ? "text-[#EC4899]" : "text-[#F2F1F8]")}>{p.stock} {config.satuanLabel}</p>
                    {p.stock <= p.min_stock && <p className="text-[10px] text-[#EC4899]">{config.kpiLabel.lowStock}</p>}
                  </div>
                  <StockMovementModal productId={p.id} userId={userId} businessId={businessId} currentStock={p.stock} price={p.price} cost={p.cost} productName={p.name} config={config} />
                  <EditProductModal product={p} />
                  <DeleteTransactionButton id={p.id} table="products" />
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#8B8AA0]">Halaman {currentPage} dari {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-white/10 text-[#8B8AA0] disabled:opacity-30"><ChevronLeft size={14} /></button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-white/10 text-[#8B8AA0] disabled:opacity-30"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-[#8B8AA0]">{products.length === 0 ? `Belum ada ${config.produkLabel.toLowerCase()}. Tambah lewat form atau Gercep Chat.` : "Nggak ada yang cocok."}</div>
      )}
    </div>
  );
}
