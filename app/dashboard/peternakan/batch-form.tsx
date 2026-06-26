"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Animal = { id: string; name: string; stock: number; category: string | null };

export default function BatchForm({ animals, userId, businessId }: { animals: Animal[]; userId: string; businessId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [batchName, setBatchName] = useState("");
  const [productId, setProductId] = useState("");
  const [entryCount, setEntryCount] = useState("");
  const [entryWeightKg, setEntryWeightKg] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetHarvestDate, setTargetHarvestDate] = useState("");
  const [dailyFeedKg, setDailyFeedKg] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName || !productId || !entryCount) return;
    setLoading(true);

    const { error } = await supabase.from("harvest_batches").insert({
      user_id: userId,
      business_id: businessId,
      product_id: productId,
      batch_name: batchName,
      entry_date: entryDate,
      entry_count: Number(entryCount),
      entry_weight_kg: entryWeightKg ? Number(entryWeightKg) : null,
      target_harvest_date: targetHarvestDate || null,
      note: note || null,
      status: "active",
    });

    if (error) { alert("Gagal simpan batch: " + error.message); setLoading(false); return; }

    if (dailyFeedKg && productId) {
      await supabase.from("products").update({ daily_feed_kg: Number(dailyFeedKg) }).eq("id", productId);
    }

    setLoading(false);
    setBatchName(""); setProductId(""); setEntryCount(""); setEntryWeightKg(""); setTargetHarvestDate(""); setDailyFeedKg(""); setNote("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
      <h2 className="font-medium mb-1">Mulai Batch Panen Baru</h2>
      <p className="text-xs text-[#8B8AA0] mb-4">Catat masuknya hewan baru untuk satu siklus panen.</p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-[11px] text-[#8B8AA0] mb-1 block">Nama batch</label>
          <input type="text" required placeholder="Contoh: Batch Ayam Juni 2026" value={batchName} onChange={(e) => setBatchName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" />
        </div>

        <div>
          <label className="text-[11px] text-[#8B8AA0] mb-1 block">Jenis hewan</label>
          <select required value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50 text-sm">
            <option value="">Pilih hewan</option>
            {animals.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-[#8B8AA0] mb-1 block">Jumlah masuk (ekor)</label>
            <input type="number" required placeholder="100" value={entryCount} onChange={(e) => setEntryCount(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" />
          </div>
          <div>
            <label className="text-[11px] text-[#8B8AA0] mb-1 block">Berat masuk (kg, opsional)</label>
            <input type="number" placeholder="Misal: 0.5" value={entryWeightKg} onChange={(e) => setEntryWeightKg(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-[#8B8AA0] mb-1 block">Tanggal masuk</label>
            <input type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" style={{ colorScheme: "dark" }} />
          </div>
          <div>
            <label className="text-[11px] text-[#8B8AA0] mb-1 block">Target panen (opsional)</label>
            <input type="date" value={targetHarvestDate} onChange={(e) => setTargetHarvestDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" style={{ colorScheme: "dark" }} />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-[#8B8AA0] mb-1 block">Kebutuhan pakan per ekor per hari (kg)</label>
          <input type="number" step="0.01" placeholder="Misal: 0.15" value={dailyFeedKg} onChange={(e) => setDailyFeedKg(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" />
          <p className="text-[10px] text-[#5A5B6A] mt-1">Dipakai untuk hitung pakan otomatis tiap hari</p>
        </div>

        <div>
          <label className="text-[11px] text-[#8B8AA0] mb-1 block">Catatan (opsional)</label>
          <input type="text" placeholder="Misal: Beli dari Pak Budi, harga Rp35.000/ekor" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm" />
        </div>

        <button type="submit" disabled={loading} className="py-2.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-50">
          {loading ? "Menyimpan..." : "Mulai Batch Panen"}
        </button>
      </div>
    </form>
  );
}
