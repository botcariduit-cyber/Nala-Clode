import { createClient } from "@/lib/supabase/server";
import BatchDetail from "./batch-detail";

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: batch } = await supabase
    .from("farm_batches")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  const { data: transactions } = await supabase
    .from("farm_transactions")
    .select("*")
    .eq("batch_id", id)
    .order("tanggal", { ascending: true });

  const cookieStore = await (await import("next/headers")).cookies();
  const activeBusinessId = cookieStore.get("active_business_id")?.value;
  const { data: businesses } = await supabase.from("businesses").select("id").eq("user_id", user!.id).eq("type", "ternak");
  const businessId = activeBusinessId && businesses?.find(b => b.id === activeBusinessId)
    ? activeBusinessId
    : businesses?.[0]?.id || "";

  if (!batch) return <div className="px-8 py-8 text-[#8B8AA0]">Batch tidak ditemukan.</div>;

  return <BatchDetail batch={batch} transactions={transactions || []} userId={user!.id} businessId={businessId} />;
}
