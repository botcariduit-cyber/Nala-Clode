import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email?.split("@")[0] || "Owner";

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-slate-100">
      <DashboardShell userName={userName}>
        {children}
      </DashboardShell>
    </div>
  );
}
