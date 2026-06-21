"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TransactionForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [type, setType] = useState("pengeluaran");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from("transactions").insert({
      user_id: userId,
      type,
      amount: Number(amount),
      description,
      category,
    });
    setLoading(false);
    setAmount("");
    setDescription("");
    setCategory("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 h-fit">
      <h2 className="font-medium mb-1">Catat transaksi</h2>

      <div className="flex gap-2">
        <button type="button" onClick={() => setType("pengeluaran")} className={"flex-1 py-2 rounded-lg text-sm font-medium " + (type === "pengeluaran" ? "bg-[#EC4899] text-[#0A0A12]" : "bg-[#0A0A12] border border-white/10 text-[#8B8AA0]")}>Pengeluaran</button>
        <button type="button" onClick={() => setType("pemasukan")} className={"flex-1 py-2 rounded-lg text-sm font-medium " + (type === "pemasukan" ? "bg-[#2DD4BF] text-[#0A0A12]" : "bg-[#0A0A12] border border-white/10 text-[#8B8AA0]")}>Pemasukan</button>
      </div>

      <input type="number" required placeholder="Jumlah (Rp)" value={amount} onChange={(e) => setAmount(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />
      <input type="text" placeholder="Deskripsi (misal: jual baju)" value={description} onChange={(e) => setDescription(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />
      <input type="text" placeholder="Kategori (misal: penjualan)" value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />

      <button type="submit" disabled={loading} className="py-2.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-50 mt-1">
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
