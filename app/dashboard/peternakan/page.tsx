import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import BatchList from "./batch-list";
import BatchForm from "./batch-form";
import HealthSchedule from "./health-schedule";
import FeedTracker from "./feed-tracker";
import { Bird, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

export default async function PeternakanPage() {
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

  const { data: animals } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business?.id || "")
    .in("category", ["Ayam Broiler", "Ayam Kampung", "Bebek", "Sapi", "Kambing", "Ikan"])
    .order("name");

  const { data: feeds } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business?.id || "")
    .in("category", ["Pakan", "Obat", "Vitamin"])
    .order("name");

  const { data: batches } = await supabase
    .from("harvest_batches")
    .select("*, products(name, daily_feed_kg)")
    .eq("business_id", business?.id || "")
    .order("created_at", { ascending: false });

  const { data: schedules } = await supabase
    .from("health_schedules")
    .select("*, products(name)")
    .eq("business_id", business?.id || "")
    .eq("status", "pending")
    .order("scheduled_date", { ascending: true })
    .limit(5);

  const activeBatches = batches?.filter((b) => b.status === "active") || [];
  const totalHewan = animals?.reduce((sum, a) => sum + a.stock, 0) || 0;
  const feedWarning = feeds?.filter((f) => f.stock <= f.min_stock).length || 0;
  const totalNilai = animals?.reduce((sum, a) => sum + (a.price || 0) * a.stock, 0) || 0;
  const scheduleToday = schedules?.filter((s) => s.scheduled_date === new Date().toISOString().split("T")[0]).length || 0;

  const kpis = [
    { label: "Total Hewan", value: `${totalHewan} ekor`, icon: Bird, color: "#38BDF8" },
    { label: "Pakan/Obat Kritis", value: feedWarning, icon: AlertTriangle, color: "#EC4899" },
    { label: "Nilai Aset Ternak", value: `Rp${totalNilai.toLocaleString("id-ID")}`, icon: TrendingUp, color: "#2DD4BF" },
    { label: "Jadwal Hari Ini", value: `${scheduleToday} jadwal`, icon: Calendar, color: "#8B5CF6" },
  ];

  return (
    <div className="px-4 sm:px-8 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold">Manajemen Ternak</h1>
        {business?.name && <span className="text-xs text-[#8B8AA0] bg-white/5 px-3 py-1 rounded-full">{business.name}</span>}
      </div>
      <p className="text-[#8B8AA0] mb-6">Pantau batch panen, pakan, jadwal kesehatan, dan untung rugi ternak kamu.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="relative bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 overflow-hidden">
            <div className="absolute w-20 h-20 rounded-full -top-6 -right-6" style={{ background: k.color, filter: "blur(40px)", opacity: 0.2 }} />
            <k.icon size={18} style={{ color: k.color }} className="mb-3 relative" />
            <p className="text-xs text-[#8B8AA0] mb-1 relative">{k.label}</p>
            <p className="text-lg font-mono font-semibold relative">{k.value}</p>
          </div>
        ))}
      </div>

      {schedules && schedules.length > 0 && (
        <div className="bg-[#0F0F1A] border border-[#F59E0B]/30 rounded-2xl p-4 mb-6">
          <p className="text-xs font-medium text-[#F59E0B] mb-2">⚠️ Jadwal Kesehatan Mendatang</p>
          <div className="flex flex-col gap-2">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-[#F2F1F8]">{s.title} — {(s.products as never as {name:string})?.name}</span>
                <span className="text-[#F59E0B] font-mono text-xs">{new Date(s.scheduled_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <BatchForm animals={animals || []} userId={user!.id} businessId={business?.id} />
        <FeedTracker feeds={feeds || []} animals={animals || []} userId={user!.id} businessId={business?.id} />
      </div>

      <BatchList batches={(batches as never) || []} userId={user!.id} businessId={business?.id} />

      <HealthSchedule animals={animals || []} schedules={(schedules as never) || []} userId={user!.id} businessId={business?.id} />
    </div>
  );
}
