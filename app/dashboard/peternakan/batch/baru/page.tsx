"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const JENIS_TERNAK = ["Ayam Broiler", "Ayam Kampung", "Bebek", "Sapi", "Kambing", "Ikan Lele", "Ikan Nila", "Burung Puyuh", "Kelinci", "Lainnya"];

export default function BatchBaruPage() {
  const router = useRouter();
  const supabase = createClient();
  const [namaBatch, setNamaBatch] = useState("");
  const [jenisTernak, setJenisTernak] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBatch || !jenisTernak) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const cookies = document.cookie.split(";").reduce((acc: Record<string, string>, c) => {
      const [k, v] = c.trim().split("=");
      acc[k] = v;
      return acc;
    }, {});
    const businessId = cookies["active_business_id"];

    const { data: batch, error } = await supabase.from("farm_batches").insert({
      user_id: user.id,
      business_id: businessId || null,
      nama_batch: namaBatch,
      jenis_ternak: jenisTernak,
      tanggal_mulai: tanggalMulai,
      status: "aktif",
    }).select("id").single();

    if (error) { alert("Gagal buat batch: " + error.message); setLoading(false); return; }

    router.push(`/dashboard/peternakan/batch/${batch.id}`);
  };

  return (
    <div className="px-4 sm:px-8 py-4 sm:py-8 max-w-lg">
      <button onClick={() => router.back()} className="text-xs text-[#8B8AA0] mb-6 flex items-center gap-1 hover:text-[#F2F1F8]">← Kembali</button>
      <h1 className="text-2xl font-semibold mb-1">Buat Batch Baru</h1>
      <p className="text-[#8B8AA0] mb-8 text-sm">Satu batch = satu siklus pemeliharaan ternak.</p>

      <form onSubmit={handleSubmit} className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <label className="text-xs text-[#8B8AA0] mb-2 block">Nama Batch</label>
          <input type="text" required placeholder="Contoh: Batch Broiler Juli 2026" value={namaBatch} onChange={(e) => setNamaBatch(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" />
        </div>

        <div>
          <label className="text-xs text-[#8B8AA0] mb-2 block">Jenis Ternak</label>
          <select required value={jenisTernak} onChange={(e) => setJenisTernak(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50 text-sm">
            <option value="">Pilih jenis ternak</option>
            {JENIS_TERNAK.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-[#8B8AA0] mb-2 block">Tanggal Mulai</label>
          <input type="date" required value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" style={{ colorScheme: "dark" }} />
        </div>

        <button type="submit" disabled={loading} className="py-3 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-50 mt-2">
          {loading ? "Membuat batch..." : "Buat Batch & Mulai Catat"}
        </button>
      </form>
    </div>
  );
}
