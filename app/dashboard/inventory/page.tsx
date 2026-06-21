import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  const totalProducts = products?.length || 0;
  const lowStockCount = products?.filter((p) => p.stock <= p.min_stock).length || 0;
  const totalValue = products?.reduce((sum, p) => sum + (p.price || 0) * p.stock, 0) || 0;

  return (
    <main className="min-h-screen bg-[#0A0A12] text-[#F2F1F8] px-6 py-10">
      <div className="max-w-[1152px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <span className="font-semibold text-lg">Gercep<span className="holo-text">AI</span></span>
          <a href="/dashboard" className="text-sm text-[#8B8AA0]">&larr; Dashboard</a>
        </div>

        <h1 className="text-2xl font-semibold mb-1">Inventory</h1>
        <p className="text-[#8B8AA0] mb-8">Daftar produk dan stok kamu.</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-[#8B8AA0] mb-1">Total produk</p>
            <p className="text-xl font-mono font-semibold">{totalProducts}</p>
          </div>
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-[#8B8AA0] mb-1">Stok mau habis</p>
            <p className="text-xl font-mono font-semibold text-[#EC4899]">{lowStockCount}</p>
          </div>
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-[#8B8AA0] mb-1">Nilai inventory</p>
            <p className="text-xl font-mono font-semibold text-[#2DD4BF]">Rp{totalValue.toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-medium">Daftar Produk</h2>
            <a href="/dashboard/chat" className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-medium">+ Tambah lewat Chat</a>
          </div>

          {products && products.length > 0 ? (
            <div className="divide-y divide-white/5">
              {products.map((p) => (
                <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-[#8B8AA0]">
                      {p.price ? `Jual Rp${Number(p.price).toLocaleString("id-ID")}` : "Harga belum diset"}
                      {p.cost ? ` · Modal Rp${Number(p.cost).toLocaleString("id-ID")}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={"font-mono font-semibold text-sm " + (p.stock <= p.min_stock ? "text-[#EC4899]" : "text-[#F2F1F8]")}>
                      {p.stock} pcs
                    </p>
                    {p.stock <= p.min_stock && (
                      <p className="text-[10px] text-[#EC4899]">Stok mau habis</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-[#8B8AA0]">
              Belum ada produk. Tambah lewat Gercep Chat, misal: &quot;tambah stok sepatu 20 pcs&quot;
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
