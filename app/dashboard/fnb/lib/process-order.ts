import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartLine } from "./calc";
import { getStockShortages } from "./calc";

export async function deductStockForSale(
  supabase: SupabaseClient,
  cart: CartLine[],
  userId: string,
  opts?: { today?: string; notePrefix?: string },
) {
  const today = opts?.today || new Date().toISOString().split("T")[0];
  const prefix = opts?.notePrefix || "Kasir";

  for (const item of cart) {
    for (const r of item.menu.menu_recipes) {
      const needed = (r.quantity / (item.menu.yield_quantity || 1)) * item.qty;
      const { data: prod } = await supabase
        .from("products")
        .select("id, stock")
        .eq("id", r.products.id)
        .single();
      if (!prod) continue;

      await supabase.from("products").update({ stock: Math.max(0, prod.stock - needed) }).eq("id", prod.id);
      await supabase.from("stock_movements").insert({
        user_id: userId,
        product_id: prod.id,
        type: "keluar",
        reason: "terpakai",
        quantity: needed,
        note: `${prefix}: ${item.menu.nama} x${item.qty}`,
        movement_date: today,
      });
    }
  }
}

export function validateCartStock(cart: CartLine[]) {
  const shortages = getStockShortages(cart);
  if (!shortages.length) return { ok: true as const };
  const msg = shortages
    .map(s => `${s.name} (butuh ${s.needed.toFixed(1)}, stok ${s.stock})`)
    .join(", ");
  return { ok: false as const, message: `Stok bahan kurang: ${msg}` };
}
