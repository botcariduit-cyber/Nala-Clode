import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import TransactionForm from "./transaction-form";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = user.user_metadata?.full_name || user.email;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const income = transactions?.filter((t) => t.type === "pemasukan").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const expense = transactions?.filter((t) => t.type === "pengeluaran").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const balance = income - expense;

  return (
    <main className="min-h-screen bg-[#0A0A12] text-[#F2F1F8] px-6 py-10">
      <div className="max-w-[1152px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <span className="font-semibold text-lg">Gercep<span className="holo-text">AI</span></span>
          <div className="flex items-center gap-3"><a href="/dashboard/inventory" className="text-sm px-4 py-2 rounded-lg border border-white/10 text-[#8B8AA0]">Inventory</a><a href="/dashboard/chat" className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-medium">Buka Gercep Chat</a><LogoutButton /></div>
        </div>

        <h1 className="text-2xl font-semibold mb-1">Halo, {name}</h1>
        <p className="text-[#8B8AA0] mb-8">Ringkasan keuangan kamu.</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-[#8B8AA0] mb-1">Saldo</p>
            <p className="text-xl font-mono font-semibold">Rp{balance.toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-[#8B8AA0] mb-1">Pemasukan</p>
            <p className="text-xl font-mono font-semibold text-[#2DD4BF]">Rp{income.toLocaleString("id-ID")}</p>
          </div>
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-[#8B8AA0] mb-1">Pengeluaran</p>
            <p className="text-xl font-mono font-semibold text-[#EC4899]">Rp{expense.toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] gap-6">
          <TransactionForm userId={user.id} />

          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
            <h2 className="font-medium mb-4">Transaksi terbaru</h2>
            <div className="flex flex-col gap-3">
              {transactions && transactions.length > 0 ? (
                transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <p className="text-sm font-medium">{t.description || t.category || "Transaksi"}</p>
                      <p className="text-xs text-[#8B8AA0]">{t.category}</p>
                    </div>
                    <p className={"font-mono text-sm font-medium " + (t.type === "pemasukan" ? "text-[#2DD4BF]" : "text-[#EC4899]")}>
                      {t.type === "pemasukan" ? "+" : "-"}Rp{Number(t.amount).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#8B8AA0]">Belum ada transaksi. Catat yang pertama di sebelah kiri.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
