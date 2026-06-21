"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeftRight, X } from "lucide-react";

const reasonOptions = [
  { value: "terjual", label: "Terjual" },
  { value: "retur", label: "Retur" },
  { value: "rusak", label: "Rusak/Hilang" },
  { value: "lainnya", label: "Lainnya" },
];

export default function StockMovementModal({ productId, userId, businessId, currentStock, price, cost, productName }: { productId: string; userId: string; businessId?: string; currentStock: number; price: number | null; cost: number | null; productName?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"masuk" | "keluar">("keluar");
  const [reason, setReason] = useState("terjual");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const qty = Number(quantity) || 0;
  const profitPreview = type === "keluar" && reason === "terjual" && price && cost ? (price - cost) * qty : type === "keluar" && (reason === "retur" || reason === "rusak") && cost ? -cost * qty : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) return;
    setLoading(true);

    const newStock = type === "masuk" ? currentStock + qty : currentStock - qty;
    const profitLoss = type === "keluar" ? profitPreview : 0;

    const { error: stockError } = await supabase.from("products").update({ stock: newStock }).eq("id", productId);
    if (stockError) { alert("Gagal update stok: " + stockError.message); setLoading(false); return; }

    const { error: moveError } = await supabase.from("stock_movements").insert({
      user_id: userId,
      product_id: productId,
      type,
      reason: type === "keluar" ? reason : null,
      quantity: qty,
      note: note || null,
      profit_loss: profitLoss,
      movement_date: date,
    });
    if (moveError) { alert("Gagal catat pergerakan: " + moveError.message); setLoading(false); return; }

    if (type === "keluar" && reason === "terjual" && price) {
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: userId,
        business_id: businessId,
        type: "pemasukan",
        scope: "bisnis",
        category: "Penjualan",
        description: `Penjualan ${productName || "produk"} (${qty} pcs) - via Inventory`,
        amount: price * qty,
        transaction_date: date,
      });
      if (txError) { alert("Stok tersimpan, tapi gagal catat ke Keuangan Bisnis: " + txError.message); }
    } else if (type === "keluar" && (reason === "retur" || reason === "rusak") && cost) {
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: userId,
        business_id: businessId,
        type: "pengeluaran",
        scope: "bisnis",
        category: "Kerugian Stok",
        description: `${reason === "retur" ? "Retur" : "Rusak/Hilang"} ${productName || "produk"} (${qty} pcs) - via Inventory`,
        amount: cost * qty,
        transaction_date: date,
      });
      if (txError) { alert("Stok tersimpan, tapi gagal catat ke Keuangan Bisnis: " + txError.message); }
    }

    setLoading(false);
    setOpen(false);
    setQuantity("");
    setNote("");
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[#8B8AA0] hover:text-[#2DD4BF] transition-colors p-1">
        <ArrowLeftRight size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 w-full max-w-sm flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium">Catat Pergerakan Stok</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-[#8B8AA0]"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setType("masuk")} className={"py-2 rounded-lg text-sm font-medium border " + (type === "masuk" ? "bg-[#2DD4BF]/15 border-[#2DD4BF]/40 text-[#2DD4BF]" : "border-white/10 text-[#8B8AA0]")}>Barang Masuk</button>
              <button type="button" onClick={() => setType("keluar")} className={"py-2 rounded-lg text-sm font-medium border " + (type === "keluar" ? "bg-[#EC4899]/15 border-[#EC4899]/40 text-[#EC4899]" : "border-white/10 text-[#8B8AA0]")}>Barang Keluar</button>
            </div>

            {type === "keluar" && (
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50">
                {reasonOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            )}

            <input type="number" required min="1" placeholder="Jumlah (pcs)" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />

            <div>
              <label className="text-[11px] text-[#8B8AA0] mb-1 block">Tanggal transaksi</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50" style={{ colorScheme: "dark" }} />
            </div>

            <input type="text" placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />

            {type === "keluar" && qty > 0 && cost && (
              <div className={"rounded-lg px-3 py-2 text-sm font-mono " + (profitPreview >= 0 ? "bg-[#2DD4BF]/10 text-[#2DD4BF]" : "bg-[#EC4899]/10 text-[#EC4899]")}>
                {profitPreview >= 0 ? "Untung" : "Rugi"} Rp{Math.abs(profitPreview).toLocaleString("id-ID")}
              </div>
            )}

            {type === "keluar" && (
              <p className="text-[10px] text-[#8B8AA0] -mt-1">Otomatis kecatat juga di Keuangan Bisnis</p>
            )}

            <button type="submit" disabled={loading} className="py-2.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-50 mt-1">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
