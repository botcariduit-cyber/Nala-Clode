import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import PertanianClient from "./pertanian-client";
import type { AgriDashboardData } from "./lib/types";

async function safeQuery<T>(query: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  try {
    const { data, error } = await query;
    if (error) return [] as unknown as T;
    return data ?? ([] as unknown as T);
  } catch {
    return [] as unknown as T;
  }
}

export default async function PertanianPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const activeBusinessId = cookieStore.get("active_business_id")?.value;

  const { data: businessData } = await supabase
    .from("businesses")
    .select("id, name, type")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  const business = businessData?.find(b => b.id === activeBusinessId) || businessData?.[0] || null;

  if (business?.type !== "pertanian") {
    return (
      <div className="px-8 py-12 text-center">
        <p className="text-[#8B8AA0] mb-4">Modul Pertanian hanya tersedia untuk bisnis tipe Pertanian.</p>
        <Link href="/dashboard/inventory" className="text-violet-400 text-sm hover:underline">Kembali ke Inventory</Link>
      </div>
    );
  }

  const businessId = business.id;

  const products = await safeQuery(
    supabase.from("products").select("*").eq("business_id", businessId).order("name")
  );

  const harvestMeta = await safeQuery(
    supabase.from("agri_harvest_meta").select("*").eq("business_id", businessId)
  );

  const saprotanMeta = await safeQuery(
    supabase.from("agri_saprotan_meta").select("*").eq("business_id", businessId)
  );

  const fields = await safeQuery(
    supabase.from("agri_fields").select("*").eq("business_id", businessId).order("created_at", { ascending: false })
  );

  const spraying = await safeQuery(
    supabase.from("agri_spraying_records").select("*").eq("business_id", businessId).order("tanggal", { ascending: false })
  );

  const costs = await safeQuery(
    supabase.from("agri_production_costs").select("*").eq("business_id", businessId).order("tanggal", { ascending: false })
  );

  const { data: history } = await supabase
    .from("inventory_history")
    .select("snapshot_date, total_value")
    .eq("user_id", user!.id)
    .order("snapshot_date", { ascending: true })
    .limit(30);

  const dashboardData: AgriDashboardData = {
    products: products || [],
    harvestMeta: harvestMeta || [],
    saprotanMeta: saprotanMeta || [],
    fields: fields || [],
    spraying: spraying || [],
    costs: costs || [],
    history: history || [],
  };

  return (
    <PertanianClient
      data={dashboardData}
      businessName={business.name}
      userId={user!.id}
      businessId={businessId}
    />
  );
}
