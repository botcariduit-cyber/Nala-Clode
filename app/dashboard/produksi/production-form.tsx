"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";

type Ingredient = { quantity: number; unit: string; products: { name: string; cost: number | null; stock: number } };
type Recipe = { id: string; name: string; yield_quantity: number; yield_unit: string; recipe_ingredients: Ingredient[] };

const BIAYA_ITEMS = ["Gas", "Listrik", "Air", "Transport", "Tenaga Kerja", "Sewa", "Biaya Lain"];
const STATUS_OPTIONS = ["draft", "diproses", "selesai"];

export default function ProductionForm({ recipes, userId, businessId }: { recipes: Recipe[]; userId: string; businessId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("diproses");
  const [loading, setLoading] = useState(false);
  const [biayaTambahan, setBiayaTambahan] = useState<{ nama: string; jumlah: string }[]>([]);

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  const totalBiayaTambahan = biayaTambahan.reduce((sum, b) => sum + (Number(b.jumlah) || 0), 0);

  const totalModalCalc = () => {
    if (!selectedRecipe) return 0;
    const qty = Number(quantity) || 1;
    const modalBahan = selectedRecipe.recipe_ingredients.reduce((sum, ing) => {
      return sum + (ing.products.cost || 0) * ing.quantity;
    }, 0);
    const modalPerUnit = modalBahan / selectedRecipe.yield_quantity;
    return modalPerUnit * qty + totalBiayaTambahan;
  };

  const hppPerUnit = () => {
    const qty = Number(quantity) || 1;
    return qty > 0 ? totalModalCalc() / qty : 0;
  };

  const canProduce = () => {
    if (!selectedRecipe) return { ok: false, shortage: [] };
    const qty = Number(quantity) || 1;
    const shortage: string[] = [];
    selectedRecipe.recipe_ingredients.forEach((ing) => {
      const needed = (ing.quantity / selectedRecipe.yield_quantity) * qty;
      if (ing.products.stock < needed) {
        shortage.push(`${ing.products.name} (butuh ${needed.toFixed(1)}, stok ${ing.products.stock})`);
      }
    });
    return { ok: shortage.length === 0, shortage };
  };

  const addBiaya = () => setBiayaTambahan([...biayaTambahan, { nama: "", jumlah: "" }]);
  const removeBiaya = (i: number) => setBiayaTambahan(biayaTambahan.filter((_, idx) => idx !== i));
  const updateBiaya = (i: number, field: string, value: string) => {
    const updated = [...biayaTambahan];
    updated[i] = { ...updated[i], [field]: value };
    setBiayaTambahan(updated);
  };

  const handleProduce = async () => {
    if (!selectedRecipe) return;
    const qty = Number(quantity) || 1;
    const { ok, shortage } = canProduce();
    if (!ok) { alert("Stok bahan tidak cukup:\n" + shortage.join("\n")); return; }
    setLoading(true);

    const totalModal = totalModalCalc();
    const hpp = hppPerUnit();

    const { error: logError } = await supabase.from("production_logs").insert({
      user_id: userId, business_id: businessId,
      recipe_id: selectedRecipe.id,
      quantity_produced: qty,
      total_material_cost: totalModal,
      additional_cost: totalBiayaTambahan,
      hpp_per_unit: hpp,
      status: status,
      production_date: date,
      note: note || null,
    });

    if (logError) { alert("Gagal catat produksi: " + logError.message); setLoading(false); return; }

    // Deduct bahan baku
    for (const ing of selectedRecipe.recipe_ingredients) {
      const needed = (ing.quantity / selectedRecipe.yield_quantity) * qty;
      const { data: product } = await supabase.from("products").select("id, stock").eq("name", ing.products.name).eq("business_id", businessId || "").single();
      if (product) {
        await supabase.from("products").update({ stock: Math.max(0, product.stock - needed) }).eq("id", product.id);
        await supabase.from("stock_movements").insert({
          user_id: userId, product_id: product.id, type: "keluar", reason: "terpakai",
          quantity: needed,
          note: `Produksi ${qty} ${selectedRecipe.yield_unit} ${selectedRecipe.name}`,
          profit_loss: -(ing.products.cost || 0) * needed,
          movement_date: date,
        });
      }
    }

    // Produk jadi masuk inventory jika status selesai
    if (status === "selesai") {
      const { data: existingProduct } = await supabase.from("products")
        .select("id, stock").eq("name", selectedRecipe.name).eq("business_id", businessId || "").maybeSingle();
      if (existingProduct) {
        await supabase.from("products").update({ stock: existingProduct.stock + qty, cost: hpp }).eq("id", existingProduct.id);
      } else {
        await supabase.from("products").insert({
          user_id: userId, business_id: businessId,
          name: selectedRecipe.name,
          category: "Produk Jadi",
          stock: qty, min_stock: 5, cost: hpp,
        });
      }
    }

    // Catat biaya tambahan ke keuangan
    if (totalBiayaTambahan > 0) {
      await supabase.from("transactions").insert({
        user_id: userId, business_id: businessId,
        type: "pengeluaran", scope: "bisnis",
        category: "Biaya Produksi",
        description: `Biaya produksi ${selectedRecipe.name} (${biayaTambahan.map(b => b.nama).join(", ")})`,
        amount: totalBiayaTambahan, transaction_date: date,
      });
    }

    await supabase.from("transactions").insert({
      user_id: userId, business_id: businessId,
      type: "pengeluaran", scope: "bisnis",
      category: "Bahan Baku",
      description: `Bahan baku produksi ${qty} ${selectedRecipe.yield_unit} ${selectedRecipe.name}`,
      amount: totalModal - totalBiayaTambahan, transaction_date: date,
    });

    setLoading(false);
    setSelectedRecipeId(""); setQuantity("1"); setNote(""); setBiayaTambahan([]);
    router.refresh();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50 placeholder:text-[#8B8AA0]";

  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6">
      <h2 className="font-medium mb-4">Catat Produksi</h2>
      <div className="flex flex-col gap-3">
        <select value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)} className={inputCls}>
          <option value="">Pilih resep produk</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        {selectedRecipe && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#8B8AA0] mb-1 block">Jumlah ({selectedRecipe.yield_unit})</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] text-[#8B8AA0] mb-1 block">Tanggal produksi</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className="text-[11px] text-[#8B8AA0] mb-1 block">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-[#0A0A12] border border-white/10 rounded-xl p-4">
              <p className="text-[11px] text-[#8B8AA0] mb-2">Bahan yang akan dipakai:</p>
              {selectedRecipe.recipe_ingredients.map((ing, i) => {
                const needed = (ing.quantity / selectedRecipe.yield_quantity) * (Number(quantity) || 1);
                const cukup = ing.products.stock >= needed;
                return (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className={cukup ? "text-[#F2F1F8]" : "text-[#EC4899]"}>{ing.products.name}</span>
                    <span className={cukup ? "text-[#8B8AA0]" : "text-[#EC4899]"}>
                      {needed.toFixed(1)} {ing.unit} {!cukup && "⚠️ kurang"}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between text-xs pt-2 mt-1 border-t border-white/5">
                <span className="text-[#8B8AA0]">Modal bahan</span>
                <span className="text-[#EC4899] font-mono">Rp{Math.round(totalModalCalc() - totalBiayaTambahan).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="bg-[#0A0A12] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-[#8B8AA0]">Biaya tambahan:</p>
                <button onClick={addBiaya} className="text-xs text-[#38BDF8] flex items-center gap-1"><Plus size={11} /> Tambah</button>
              </div>
              {biayaTambahan.length === 0 && <p className="text-[11px] text-[#5A5B6A]">Belum ada biaya tambahan.</p>}
              {biayaTambahan.map((b, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_auto] gap-2 mb-2">
                  <select value={b.nama} onChange={(e) => updateBiaya(i, "nama", e.target.value)} className="px-3 py-2 rounded-lg bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none">
                    <option value="">Pilih biaya</option>
                    {BIAYA_ITEMS.map(bi => <option key={bi} value={bi}>{bi}</option>)}
                  </select>
                  <input type="number" placeholder="Jumlah (Rp)" value={b.jumlah} onChange={(e) => updateBiaya(i, "jumlah", e.target.value)} className="px-3 py-2 rounded-lg bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none" />
                  <button onClick={() => removeBiaya(i)} className="text-[#EC4899] p-1"><Trash2 size={14} /></button>
                </div>
              ))}
              {biayaTambahan.length > 0 && (
                <div className="flex justify-between text-xs border-t border-white/5 pt-2 mt-1">
                  <span className="text-[#8B8AA0]">Total biaya tambahan</span>
                  <span className="text-[#6366F1] font-mono">Rp{totalBiayaTambahan.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>

            <div className="bg-[#0A0A12] border border-[#2DD4BF]/20 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#8B8AA0]">Total biaya produksi</span>
                <span className="text-[#EC4899] font-mono font-semibold">Rp{Math.round(totalModalCalc()).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8B8AA0]">HPP per {selectedRecipe.yield_unit}</span>
                <span className="text-[#2DD4BF] font-mono font-semibold">Rp{Math.round(hppPerUnit()).toLocaleString("id-ID")}</span>
              </div>
              {status === "selesai" && <p className="text-[10px] text-[#2DD4BF] mt-2">✓ Produk jadi akan otomatis masuk Inventory</p>}
            </div>

            <input type="text" placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />

            <button onClick={handleProduce} disabled={loading || !canProduce().ok} className="py-2.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-40">
              {loading ? "Memproses..." : `Produksi ${quantity} ${selectedRecipe.yield_unit} ${selectedRecipe.name}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
