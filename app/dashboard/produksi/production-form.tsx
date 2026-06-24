"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Ingredient = { quantity: number; unit: string; products: { name: string; cost: number | null; stock: number } };
type Recipe = { id: string; name: string; yield_quantity: number; yield_unit: string; recipe_ingredients: Ingredient[] };

export default function ProductionForm({ recipes, userId, businessId }: { recipes: Recipe[]; userId: string; businessId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  const totalModalCalc = () => {
    if (!selectedRecipe) return 0;
    const qty = Number(quantity) || 1;
    const modalPerBatch = selectedRecipe.recipe_ingredients.reduce((sum, ing) => {
      return sum + (ing.products.cost || 0) * ing.quantity;
    }, 0);
    return (modalPerBatch / selectedRecipe.yield_quantity) * qty;
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

  const handleProduce = async () => {
    if (!selectedRecipe) return;
    const qty = Number(quantity) || 1;
    const { ok, shortage } = canProduce();
    if (!ok) { alert("Stok bahan tidak cukup:\n" + shortage.join("\n")); return; }

    setLoading(true);
    const totalModal = totalModalCalc();

    const { error: logError } = await supabase.from("production_logs").insert({
      user_id: userId,
      business_id: businessId,
      recipe_id: selectedRecipe.id,
      quantity_produced: qty,
      total_material_cost: totalModal,
      production_date: date,
      note: note || null,
    });

    if (logError) { alert("Gagal catat produksi: " + logError.message); setLoading(false); return; }

    for (const ing of selectedRecipe.recipe_ingredients) {
      const needed = (ing.quantity / selectedRecipe.yield_quantity) * qty;
      const { data: product } = await supabase.from("products").select("id, stock").eq("name", ing.products.name).eq("business_id", businessId || "").single();
      if (product) {
        await supabase.from("products").update({ stock: Math.max(0, product.stock - needed) }).eq("id", product.id);
        await supabase.from("stock_movements").insert({
          user_id: userId,
          product_id: product.id,
          type: "keluar",
          reason: "terpakai",
          quantity: needed,
          note: `Produksi ${qty} ${selectedRecipe.yield_unit} ${selectedRecipe.name}`,
          profit_loss: -(ing.products.cost || 0) * needed,
          movement_date: date,
        });
      }
    }

    await supabase.from("transactions").insert({
      user_id: userId,
      business_id: businessId,
      type: "pengeluaran",
      scope: "bisnis",
      category: "Biaya Produksi",
      description: `Produksi ${qty} ${selectedRecipe.yield_unit} ${selectedRecipe.name}`,
      amount: totalModal,
      transaction_date: date,
    });

    setLoading(false);
    setSelectedRecipeId("");
    setQuantity("1");
    setNote("");
    router.refresh();
  };

  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6">
      <h2 className="font-medium mb-4">Catat Produksi</h2>
      <div className="flex flex-col gap-3">
        <select value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50">
          <option value="">Pilih resep produk</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        {selectedRecipe && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#8B8AA0] mb-1 block">Jumlah diproduksi ({selectedRecipe.yield_unit})</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50" />
              </div>
              <div>
                <label className="text-[11px] text-[#8B8AA0] mb-1 block">Tanggal produksi</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50" style={{ colorScheme: "dark" }} />
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
                <span className="text-[#8B8AA0] font-medium">Total modal produksi</span>
                <span className="text-[#EC4899] font-semibold font-mono">Rp{Math.round(totalModalCalc()).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <input type="text" placeholder="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] text-sm placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />

            <button onClick={handleProduce} disabled={loading || !canProduce().ok} className="py-2.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-40">
              {loading ? "Memproses..." : `Produksi ${quantity} ${selectedRecipe.yield_unit} ${selectedRecipe.name}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
