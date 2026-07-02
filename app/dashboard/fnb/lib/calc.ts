export type FnbProduct = { id: string; name: string; cost: number | null; stock: number; min_stock?: number; category?: string | null };
export type FnbMenuRecipe = { id: string; quantity: number; unit: string; products: FnbProduct };
export type FnbMenu = {
  id: string;
  nama: string;
  kategori?: string | null;
  harga_jual: number;
  yield_quantity: number;
  status?: string;
  foto_url?: string | null;
  menu_recipes: FnbMenuRecipe[];
};

export type CartLine = { menu: FnbMenu; qty: number };

export function calcHpp(menu: FnbMenu): number {
  const total = menu.menu_recipes.reduce((s, r) => s + (r.products.cost || 0) * r.quantity, 0);
  return total / (menu.yield_quantity || 1);
}

export function calcMargin(menu: FnbMenu) {
  const hpp = calcHpp(menu);
  if (hpp <= 0 || menu.harga_jual <= 0) return null;
  const laba = menu.harga_jual - hpp;
  return { hpp, laba, marginPct: Math.round((laba / menu.harga_jual) * 100), isLoss: laba < 0 };
}

export function fmtRp(n: number) {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp${Math.round(n / 1_000)}rb`;
  return `Rp${n.toLocaleString("id-ID")}`;
}

export function getStockShortages(cart: CartLine[]) {
  const map: Record<string, { name: string; needed: number; stock: number }> = {};
  for (const item of cart) {
    if (!item.menu.menu_recipes.length) continue;
    for (const r of item.menu.menu_recipes) {
      const needed = (r.quantity / (item.menu.yield_quantity || 1)) * item.qty;
      const id = r.products.id;
      if (!map[id]) map[id] = { name: r.products.name, needed: 0, stock: r.products.stock };
      map[id].needed += needed;
    }
  }
  return Object.values(map).filter(x => x.stock < x.needed);
}
