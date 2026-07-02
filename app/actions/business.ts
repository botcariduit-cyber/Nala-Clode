"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function switchBusiness(businessId: string) {
  const cookieStore = await cookies();
  cookieStore.set("active_business_id", businessId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect("/dashboard/inventory");
}

export async function deleteBusiness(businessId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // Ambil semua product ids dan recipe ids dulu
  const { data: prods } = await supabase.from("products").select("id").eq("business_id", businessId);
  const prodIds = prods?.map(p => p.id) || [];
  const { data: recs } = await supabase.from("recipes").select("id").eq("business_id", businessId);
  const recIds = recs?.map(r => r.id) || [];

  // Hapus semua child tables secara parallel
  await Promise.all([
    ...(prodIds.length ? [
      supabase.from("weight_logs").delete().in("product_id", prodIds),
      supabase.from("health_schedules").delete().in("product_id", prodIds),
      supabase.from("stock_movements").delete().in("product_id", prodIds),
      supabase.from("harvest_batches").delete().in("product_id", prodIds),
      supabase.from("agri_harvest_meta").delete().in("product_id", prodIds),
      supabase.from("agri_saprotan_meta").delete().in("product_id", prodIds),
    ] : []),
    ...(recIds.length ? [
      supabase.from("recipe_ingredients").delete().in("recipe_id", recIds),
    ] : []),
    supabase.from("production_logs").delete().eq("business_id", businessId),
    supabase.from("farm_batches").delete().eq("business_id", businessId),
    supabase.from("inventory_history").delete().eq("business_id", businessId),
    supabase.from("agri_fields").delete().eq("business_id", businessId),
    supabase.from("agri_spraying_records").delete().eq("business_id", businessId),
    supabase.from("agri_production_costs").delete().eq("business_id", businessId),
  ]);
  // Hapus yang ada FK ke products/recipes dulu baru bisnis
  await Promise.all([
    supabase.from("recipes").delete().eq("business_id", businessId),
    supabase.from("health_schedules").delete().eq("business_id", businessId),
  ]);
  await supabase.from("products").delete().eq("business_id", businessId);
  await supabase.from("businesses").delete().eq("id", businessId).eq("user_id", user.id);
  const cookieStore = await cookies();
  const activeId = cookieStore.get("active_business_id")?.value;
  if (activeId === businessId) cookieStore.delete("active_business_id");
  redirect("/dashboard/inventory");
}

export async function addNewBusiness() {
  const cookieStore = await cookies();
  cookieStore.delete("active_business_id");
  redirect("/onboarding?mode=new");
}
