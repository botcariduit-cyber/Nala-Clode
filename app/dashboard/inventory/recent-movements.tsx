import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

type Movement = { id: string; type: string; reason: string | null; quantity: number; note: string | null; profit_loss: number; created_at: string; products: { name: string } | null };

const reasonLabel: Record<string, string> = { terjual: "Terjual", retur: "Retur", rusak: "Rusak / Hilang", lainnya: "Lainnya" };

export default function RecentMovements({ movements }: { movements: Movement[] }) {
  if (!movements || movements.length === 0) return null;

  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[11px] font-medium tracking-[0.12em] text-[#8B8AA0] uppercase">Riwayat Pergerakan Stok</h2>
        <span className="text-[10px] text-[#5A5B6A]">{movements.length} transaksi terakhir</span>
      </div>
      <div className="flex flex-col">
        {movements.map((m, i) => {
          const isMasuk = m.type === "masuk";
          return (
            <div key={m.id} className={"flex items-center justify-between py-4" + (i !== movements.length - 1 ? " border-b border-white/[0.06]" : "")}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0">
                  {isMasuk ? <ArrowDownToLine size={13} className="text-[#8B8AA0]" /> : <ArrowUpFromLine size={13} className="text-[#8B8AA0]" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#F2F1F8] truncate">{m.products?.name || "Produk"}</p>
                  <p className="text-[11px] text-[#5A5B6A] mt-0.5">
                    {m.note || (isMasuk ? "Barang masuk" : reasonLabel[m.reason || ""] || "Barang keluar")}
                    <span className="mx-1.5">·</span>
                    {new Date(m.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 pl-4">
                <p className="font-mono text-sm text-[#F2F1F8]">{isMasuk ? "+" : "−"}{m.quantity} <span className="text-[#5A5B6A] text-xs">pcs</span></p>
                {m.type === "keluar" && m.profit_loss !== 0 && (
                  <p className={"text-[11px] font-mono mt-0.5 " + (m.profit_loss >= 0 ? "text-[#2DD4BF]" : "text-[#EC4899]")}>
                    {m.profit_loss >= 0 ? "+" : "−"}Rp{Math.abs(m.profit_loss).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
