import { createClient } from "@/lib/supabase/server";
import DashboardOwnerClient from "./dashboard-owner-client";

export default async function DashboardOwnerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, type")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  if (!businesses || businesses.length === 0) {
    return <div className="px-4 sm:px-8 py-8 text-[#8B8AA0]">Belum ada bisnis. Buat bisnis dulu di onboarding.</div>;
  }

  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();
  const startOfMonth = new Date(tahun, now.getMonth(), 1).toISOString().split("T")[0];
  const startOfLastMonth = new Date(tahun, now.getMonth() - 1, 1).toISOString().split("T")[0];
  const endOfLastMonth = new Date(tahun, now.getMonth(), 0).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];
  const startOfYear = new Date(tahun, 0, 1).toISOString().split("T")[0];

  const businessData = await Promise.all(
    businesses.map(async (biz) => {
      const { data: monthTx } = await supabase
        .from("transactions")
        .select("type, amount, category")
        .eq("business_id", biz.id)
        .eq("scope", "bisnis")
        .gte("transaction_date", startOfMonth);

      const { data: lastMonthTx } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("business_id", biz.id)
        .eq("scope", "bisnis")
        .gte("transaction_date", startOfLastMonth)
        .lte("transaction_date", endOfLastMonth);

      const { data: yearTx } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("business_id", biz.id)
        .eq("scope", "bisnis")
        .gte("transaction_date", startOfYear);

      const { data: products } = await supabase
        .from("products")
        .select("id, name, stock, min_stock")
        .eq("business_id", biz.id);

      const { data: monthOrders } = await supabase
        .from("orders")
        .select("total, laba")
        .eq("business_id", biz.id)
        .gte("order_date", startOfMonth);

      const { data: target } = await supabase
        .from("business_targets")
        .select("target_omzet")
        .eq("business_id", biz.id)
        .eq("bulan", bulan)
        .eq("tahun", tahun)
        .maybeSingle();

      const omzetBulan = monthTx?.filter(t => t.type === "pemasukan").reduce((s, t) => s + Number(t.amount), 0) || 0;
      const pengeluaranBulan = monthTx?.filter(t => t.type === "pengeluaran").reduce((s, t) => s + Number(t.amount), 0) || 0;
      const labaBulan = omzetBulan - pengeluaranBulan;

      const omzetBulanLalu = lastMonthTx?.filter(t => t.type === "pemasukan").reduce((s, t) => s + Number(t.amount), 0) || 0;
      const omzetTahun = yearTx?.filter(t => t.type === "pemasukan").reduce((s, t) => s + Number(t.amount), 0) || 0;

      const pengeluaranByCategory: Record<string, number> = {};
      monthTx?.filter(t => t.type === "pengeluaran").forEach(t => {
        const cat = t.category || "Lainnya";
        pengeluaranByCategory[cat] = (pengeluaranByCategory[cat] || 0) + Number(t.amount);
      });

      const stokKritis = products?.filter(p => p.stock <= p.min_stock) || [];
      const totalOrderBulan = monthOrders?.length || 0;
      const growthPct = omzetBulanLalu > 0 ? Math.round((omzetBulan - omzetBulanLalu) / omzetBulanLalu * 100) : 0;
      const targetOmzet = target?.target_omzet || 0;
      const targetPct = targetOmzet > 0 ? Math.round(omzetBulan / targetOmzet * 100) : 0;

      return {
        id: biz.id, name: biz.name, type: biz.type,
        omzetBulan, labaBulan, omzetBulanLalu, omzetTahun, growthPct,
        totalOrderBulan, stokKritis, pengeluaranByCategory,
        targetOmzet, targetPct,
        margin: omzetBulan > 0 ? Math.round(labaBulan / omzetBulan * 100) : 0,
      };
    })
  );

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6">
      <DashboardOwnerClient businesses={businessData} bulan={bulan} tahun={tahun} userId={user!.id} />
    </div>
  );
}
