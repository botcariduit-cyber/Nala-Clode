import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getConfig } from "../inventory/business-config";
import RecipeList from "./recipe-list";
import ProductionForm from "./production-form";

export default async function ProduksiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const activeBusinessId = cookieStore.get("active_business_id")?.value;

  const { data: businessData } = await supabase
    .from("businesses")
    .select("id, type, name")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  const business = businessData?.find((b) => b.id === activeBusinessId) || businessData?.[0] || null;
  const config = getConfig(business?.type);

  const { data: materials } = await supabase
    .from("products")
    .select("id, name, stock, cost, category")
    .eq("business_id", business?.id || "")
    .order("name");

  const { data: finishedProducts } = await supabase
    .from("products")
    .select("id, name, stock, price, cost, category")
    .eq("business_id", business?.id || "")
    .order("name");

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*, products(name, cost, stock))")
    .eq("business_id", business?.id || "")
    .order("created_at", { ascending: false });

  const { data: productionLogs } = await supabase
    .from("production_logs")
    .select("*, recipes(name)")
    .eq("business_id", business?.id || "")
    .order("production_date", { ascending: false })
    .limit(10);

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Produksi</h1>
        {business?.name && <span className="text-xs text-[#8B8AA0] bg-white/5 px-3 py-1 rounded-full">{business.name}</span>}
      </div>
      <p className="text-[#8B8AA0] mb-8">Kelola resep, produksi, dan hitung modal otomatis.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <h2 className="font-medium mb-1">Cara pakai</h2>
          <ol className="text-sm text-[#8B8AA0] flex flex-col gap-2 mt-3">
            <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] text-xs flex items-center justify-center flex-shrink-0">1</span>Tambah bahan baku di <a href="/dashboard/inventory" className="text-[#38BDF8] underline">Inventory</a></li>
            <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs flex items-center justify-center flex-shrink-0">2</span>Buat resep produk jadi + daftar bahan yang dipakai</li>
            <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] text-xs flex items-center justify-center flex-shrink-0">3</span>Catat produksi → stok bahan otomatis berkurang, modal dihitung otomatis</li>
            <li className="flex gap-3"><span className="w-5 h-5 rounded-full bg-[#EC4899]/20 text-[#EC4899] text-xs flex items-center justify-center flex-shrink-0">4</span>Jual produk jadi di Inventory → lihat untung bersih</li>
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-[#8B8AA0] mb-1">Total Resep</p>
            <p className="text-2xl font-mono font-semibold">{recipes?.length || 0}</p>
          </div>
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-[#8B8AA0] mb-1">Total Produksi</p>
            <p className="text-2xl font-mono font-semibold">{productionLogs?.length || 0}</p>
          </div>
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 col-span-2">
            <p className="text-xs text-[#8B8AA0] mb-1">Total Modal Produksi</p>
            <p className="text-xl font-mono font-semibold text-[#EC4899]">
              Rp{(productionLogs?.reduce((sum, l) => sum + Number(l.total_material_cost || 0), 0) || 0).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      <RecipeList recipes={(recipes as never) || []} materials={materials || []} finishedProducts={finishedProducts || []} userId={user!.id} businessId={business?.id} config={config} />

      {(recipes?.length || 0) > 0 && (
        <ProductionForm recipes={(recipes as never) || []} userId={user!.id} businessId={business?.id} />
      )}

      {(productionLogs?.length || 0) > 0 && (
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mt-6">
          <h2 className="font-medium mb-4">Riwayat Produksi</h2>
          <div className="flex flex-col gap-3">
            {productionLogs?.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <p className="text-sm font-medium">{(log.recipes as never as { name: string })?.name}</p>
                  <p className="text-xs text-[#8B8AA0]">{log.quantity_produced} unit · {new Date(log.production_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <p className="font-mono text-sm text-[#EC4899]">-Rp{Number(log.total_material_cost).toLocaleString("id-ID")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
