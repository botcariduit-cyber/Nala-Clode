import { createClient } from "@/lib/supabase/server";
import ProductForm from "./product-form";
import ProductList from "./product-list";
import InventoryCharts from "./inventory-charts";
import TrendChart from "./trend-chart";
import RecentMovements from "./recent-movements";
import MovementsChart from "./movements-chart";
import ProfitIndicator from "./profit-indicator";
import LossBreakdownChart from "./loss-breakdown-chart";
import { Package, AlertTriangle, Wallet, TrendingUp } from "lucide-react";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase.from("businesses").select("id").eq("user_id", user!.id).limit(1).single();
  const { data: products } = await supabase.from("products").select("*").order("name", { ascending: true });
  const { data: movements } = await supabase.from("stock_movements").select("id, type, reason, quantity, note, profit_loss, created_at, products(name)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(8);
  const { data: allMovements } = await supabase.from("stock_movements").select("profit_loss, reason").eq("user_id", user!.id);

  const totalRealizedProfit = allMovements?.reduce((sum, m) => sum + Number(m.profit_loss || 0), 0) || 0;
  const totalProducts = products?.length || 0;
  const lowStockCount = products?.filter((p) => p.stock <= p.min_stock).length || 0;
  const totalValue = products?.reduce((sum, p) => sum + (p.price || 0) * p.stock, 0) || 0;
  const avgPrice = totalProducts > 0 ? (products!.reduce((sum, p) => sum + (p.price || 0), 0) / totalProducts) : 0;

  await supabase.from("inventory_history").upsert(
    { user_id: user!.id, business_id: business?.id, snapshot_date: new Date().toISOString().split("T")[0], total_value: totalValue },
    { onConflict: "user_id,snapshot_date" }
  );

  const { data: history } = await supabase.from("inventory_history").select("snapshot_date, total_value").eq("user_id", user!.id).order("snapshot_date", { ascending: true }).limit(30);

  const kpis = [
    { label: "Total produk", value: totalProducts, icon: Package, color: "#38BDF8" },
    { label: "Stok mau habis", value: lowStockCount, icon: AlertTriangle, color: "#EC4899" },
    { label: "Nilai inventory", value: `Rp${totalValue.toLocaleString("id-ID")}`, icon: Wallet, color: "#2DD4BF" },
    { label: "Rata-rata harga", value: `Rp${Math.round(avgPrice).toLocaleString("id-ID")}`, icon: TrendingUp, color: "#8B5CF6" },
  ];

  return (
    <div className="px-8 py-8 max-w-[1100px]">
      <h1 className="text-2xl font-semibold mb-1">Inventory</h1>
      <p className="text-[#8B8AA0] mb-8">Daftar produk dan stok kamu.</p>

      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {kpis.map((k) => (
          <div key={k.label} className="relative bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 overflow-hidden">
            <div className="absolute w-20 h-20 rounded-full -top-6 -right-6" style={{ background: k.color, filter: "blur(40px)", opacity: 0.2 }} />
            <k.icon size={18} style={{ color: k.color }} className="mb-3 relative" />
            <p className="text-xs text-[#8B8AA0] mb-1 relative">{k.label}</p>
            <p className="text-lg font-mono font-semibold relative">{k.value}</p>
          </div>
        ))}
      </div>

      <TrendChart history={history || []} />
      <ProfitIndicator totalProfit={totalRealizedProfit} totalAssetValue={totalValue} />
      <LossBreakdownChart movements={(allMovements as never) || []} />
      <InventoryCharts products={products || []} />
      <MovementsChart movements={(movements as never) || []} />
      <RecentMovements movements={(movements as never) || []} />

      <div className="grid md:grid-cols-[320px_1fr] gap-6">
        <ProductForm userId={user!.id} businessId={business?.id} nextSkuNumber={totalProducts + 1} />
        <ProductList products={products || []} userId={user!.id} businessId={business?.id} />
      </div>
    </div>
  );
}
