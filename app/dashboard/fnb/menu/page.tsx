import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import FnbMenuClient from "./menu-client";

export default async function FnbMenuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const activeBusinessId = cookieStore.get("active_business_id")?.value;

  const { data: businessData } = await supabase
    .from("businesses").select("id, type, name").eq("user_id", user!.id).order("created_at", { ascending: true });

  const business = businessData?.find(b => b.id === activeBusinessId) || businessData?.[0] || null;

  if (business?.type !== "kuliner") {
    return (
      <div className="px-8 py-8 text-[#8B8AA0]">
        Modul ini hanya tersedia untuk bisnis F&B / Kuliner.
      </div>
    );
  }

  const { data: menus } = await supabase
    .from("menus")
    .select("*, menu_recipes(*, products(id, name, cost, stock, category))")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const { data: products } = await supabase
    .from("products")
    .select("id, name, cost, stock, min_stock, category")
    .eq("business_id", business.id)
    .order("name");

  return (
    <div className="px-4 sm:px-8 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Master Menu</h1>
        {business?.name && <span className="text-xs text-[#8B8AA0] bg-white/5 px-3 py-1 rounded-full">{business.name}</span>}
      </div>
      <p className="text-[#8B8AA0] mb-6">Kelola menu, resep bahan, dan lihat untung/rugi otomatis.</p>
      <FnbMenuClient menus={menus || []} products={products || []} userId={user!.id} businessId={business.id} />
    </div>
  );
}
