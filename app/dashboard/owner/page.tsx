import { createClient } from "@/lib/supabase/server";
import DashboardOwnerClient from "./dashboard-owner-client";

export type TopProduct = { id: string; name: string; sold: number; revenue: number; emoji: string };
export type RecentTransaction = {
  id: string; customer: string; status: "Selesai" | "Diproses" | "Pending";
  amount: number; time: string; businessName: string;
};

const PRODUCT_EMOJI = ["🍜", "☕", "🧁", "🍱", "🥤", "🍕", "🥗", "🍰"];

export default async function DashboardOwnerPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const range = params.range || "month";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .maybeSingle();
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Owner";

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, type")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  if (!businesses || businesses.length === 0) {
    return <div className="px-8 py-8 text-slate-500">Belum ada bisnis. Buat bisnis dulu di onboarding.</div>;
  }

  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();
  const today = now.toISOString().split("T")[0];
  const startOfYear = new Date(tahun, 0, 1).toISOString().split("T")[0];

  let periodStart: string;
  let periodEnd: string = today;
  let prevPeriodStart: string;
  let prevPeriodEnd: string;

  if (range === "today") {
    periodStart = today;
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    prevPeriodStart = yesterday.toISOString().split("T")[0];
    prevPeriodEnd = prevPeriodStart;
  } else if (range === "year") {
    periodStart = startOfYear;
    prevPeriodStart = new Date(tahun - 1, 0, 1).toISOString().split("T")[0];
    prevPeriodEnd = new Date(tahun - 1, 11, 31).toISOString().split("T")[0];
  } else if (range === "custom" && params.from && params.to) {
    periodStart = params.from;
    periodEnd = params.to;
    const fromDate = new Date(params.from);
    const toDate = new Date(params.to);
    const diffDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000));
    const prevTo = new Date(fromDate); prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - diffDays);
    prevPeriodStart = prevFrom.toISOString().split("T")[0];
    prevPeriodEnd = prevTo.toISOString().split("T")[0];
  } else {
    periodStart = new Date(tahun, now.getMonth(), 1).toISOString().split("T")[0];
    prevPeriodStart = new Date(tahun, now.getMonth() - 1, 1).toISOString().split("T")[0];
    prevPeriodEnd = new Date(tahun, now.getMonth(), 0).toISOString().split("T")[0];
  }

  const startOfMonth = periodStart;
  const startOfLastMonth = prevPeriodStart;
  const endOfLastMonth = prevPeriodEnd;
  const bizIds = businesses.map(b => b.id);
  const bizNameMap = Object.fromEntries(businesses.map(b => [b.id, b.name]));

  const businessData = await Promise.all(
    businesses.map(async (biz) => {
      const { data: monthTx } = await supabase
        .from("transactions")
        .select("type, amount, category")
        .eq("business_id", biz.id)
        .eq("scope", "bisnis")
        .gte("transaction_date", startOfMonth)
        .lte("transaction_date", periodEnd);

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
        .gte("order_date", startOfMonth)
        .lte("order_date", periodEnd);

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

      const { data: dailyTx } = await supabase
        .from("transactions")
        .select("transaction_date, amount")
        .eq("business_id", biz.id)
        .eq("scope", "bisnis")
        .eq("type", "pemasukan")
        .gte("transaction_date", startOfMonth)
        .lte("transaction_date", periodEnd);

      const dailyMap: Record<string, number> = {};
      dailyTx?.forEach(t => {
        const d = t.transaction_date;
        dailyMap[d] = (dailyMap[d] || 0) + Number(t.amount);
      });

      return {
        id: biz.id, name: biz.name, type: biz.type,
        omzetBulan, labaBulan, omzetBulanLalu, omzetTahun, growthPct,
        totalOrderBulan, stokKritis, pengeluaranByCategory,
        targetOmzet, targetPct, dailyMap,
        margin: omzetBulan > 0 ? Math.round(labaBulan / omzetBulan * 100) : 0,
      };
    })
  );

  // Top products from order_items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("qty, harga_jual, menus(nama), orders!inner(business_id, order_date)")
    .in("orders.business_id", bizIds)
    .gte("orders.order_date", startOfMonth)
    .lte("orders.order_date", periodEnd);

  const productMap: Record<string, { name: string; sold: number; revenue: number }> = {};
  orderItems?.forEach(item => {
    const raw = item.menus as unknown;
    const menu = (Array.isArray(raw) ? raw[0] : raw) as { nama: string } | null | undefined;
    if (!menu?.nama) return;
    const key = menu.nama;
    if (!productMap[key]) productMap[key] = { name: menu.nama, sold: 0, revenue: 0 };
    productMap[key].sold += Number(item.qty);
    productMap[key].revenue += Number(item.qty) * Number(item.harga_jual);
  });

  let topProducts: TopProduct[] = Object.entries(productMap)
    .map(([name, data], i) => ({
      id: name,
      name: data.name,
      sold: data.sold,
      revenue: data.revenue,
      emoji: PRODUCT_EMOJI[i % PRODUCT_EMOJI.length],
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  if (topProducts.length === 0) {
    const { data: allProducts } = await supabase
      .from("products")
      .select("id, name, price")
      .in("business_id", bizIds)
      .order("name")
      .limit(5);
    topProducts = (allProducts || []).map((p, i) => ({
      id: p.id,
      name: p.name,
      sold: 0,
      revenue: Number(p.price || 0),
      emoji: PRODUCT_EMOJI[i % PRODUCT_EMOJI.length],
    }));
  }

  // Recent transactions
  const { data: recentTxRaw } = await supabase
    .from("transactions")
    .select("id, amount, type, description, category, transaction_date, created_at, business_id")
    .in("business_id", bizIds)
    .eq("scope", "bisnis")
    .order("created_at", { ascending: false })
    .limit(6);

  const recentTransactions: RecentTransaction[] = (recentTxRaw || []).map(tx => {
    const created = tx.created_at ? new Date(tx.created_at) : new Date();
    const hours = created.getHours().toString().padStart(2, "0");
    const mins = created.getMinutes().toString().padStart(2, "0");
    const customer = tx.description?.split(",")[0]?.split(" x")[0] || tx.category || "Pelanggan";
    return {
      id: tx.id,
      customer: customer.length > 20 ? customer.slice(0, 20) + "…" : customer,
      status: tx.type === "pemasukan" ? "Selesai" : "Diproses",
      amount: Number(tx.amount),
      time: `${hours}:${mins}`,
      businessName: bizNameMap[tx.business_id] || "",
    };
  });

  return (
    <DashboardOwnerClient
      businesses={businessData}
      topProducts={topProducts}
      recentTransactions={recentTransactions}
      bulan={bulan}
      tahun={tahun}
      userId={user!.id}
      userName={userName}
    />
  );
}
