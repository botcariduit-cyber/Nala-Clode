import { createClient } from "@/lib/supabase/server";
import TransactionForm from "../transaction-form";
import DeleteTransactionButton from "../delete-transaction-button";

export default async function KeuanganBisnisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("scope", "bisnis")
    .order("created_at", { ascending: false })
    .limit(20);

  const income = transactions?.filter((t) => t.type === "pemasukan").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const expense = transactions?.filter((t) => t.type === "pengeluaran").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const balance = income - expense;

  return (
    <div className="px-8 py-8 max-w-[1000px]">
      <h1 className="text-2xl font-semibold mb-1">Keuangan Bisnis</h1>
      <p className="text-[#8B8AA0] mb-8">Penjualan, modal, operasional usaha kamu.</p>

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
        <TransactionForm userId={user!.id} scope="bisnis" businessId={business?.id} />

        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
          <h2 className="font-medium mb-4">Transaksi terbaru</h2>
          <div className="flex flex-col gap-3">
            {transactions && transactions.length > 0 ? (
              transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b border-white/5 pb-3 group">
                  <div>
                    <p className="text-sm font-medium">{t.description || t.category || "Transaksi"}</p>
                    <p className="text-xs text-[#8B8AA0]">{t.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={"font-mono text-sm font-medium " + (t.type === "pemasukan" ? "text-[#2DD4BF]" : "text-[#EC4899]")}>
                      {t.type === "pemasukan" ? "+" : "-"}Rp{Number(t.amount).toLocaleString("id-ID")}
                    </p>
                    <DeleteTransactionButton id={t.id} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#8B8AA0]">Belum ada transaksi bisnis.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
