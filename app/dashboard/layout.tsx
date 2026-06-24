import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./dashboard-shell";
import { cookies } from "next/headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const cookieStore = await cookies();
  const activeId = cookieStore.get("active_business_id")?.value;
  const activeBusiness = businesses?.find((b) => b.id === activeId) || businesses?.[0] || null;

  return (
    <div className="min-h-screen bg-[#0A0A12] text-[#F2F1F8] flex">
      <DashboardShell businesses={businesses || []} activeBusiness={activeBusiness}>
        {children}
      </DashboardShell>
    </div>
  );
}
