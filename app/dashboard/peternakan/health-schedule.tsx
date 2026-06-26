"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Check, Calendar } from "lucide-react";

type Animal = { id: string; name: string; stock: number };
type Schedule = { id: string; title: string; scheduled_date: string; medicine_name: string | null; dose: string | null; status: string; note: string | null; products: { name: string } | null };

export default function HealthSchedule({ animals, schedules, userId, businessId }: { animals: Animal[]; schedules: Schedule[]; userId: string; businessId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [productId, setProductId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dose, setDose] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title || !scheduledDate) return;
    setLoading(true);

    const { error } = await supabase.from("health_schedules").insert({
      user_id: userId,
      business_id: businessId,
      product_id: productId || null,
      title,
      scheduled_date: scheduledDate,
      medicine_name: medicineName || null,
      dose: dose || null,
      note: note || null,
      status: "pending",
    });

    if (error) { alert("Gagal simpan jadwal: " + error.message); setLoading(false); return; }
    setLoading(false);
    setShowForm(false);
    setTitle(""); setProductId(""); setScheduledDate(""); setMedicineName(""); setDose(""); setNote("");
    router.refresh();
  };

  const handleDone = async (id: string) => {
    await supabase.from("health_schedules").update({ status: "done" }).eq("id", id);
    router.refresh();
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#8B5CF6]" />
          <h2 className="font-medium">Jadwal Kesehatan & Vaksin</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-medium flex items-center gap-1">
          <Plus size={13} /> Tambah Jadwal
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0A0A12] border border-white/10 rounded-xl p-4 mb-4 flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-[#8B8AA0] mb-1 block">Nama jadwal</label>
            <input type="text" placeholder="Misal: Vaksin ND, Vitamin B-Complex, Obat Cacing..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] text-sm placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#8B8AA0] mb-1 block">Untuk hewan</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50">
                <option value="">Semua hewan</option>
                {animals.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#8B8AA0] mb-1 block">Tanggal jadwal</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] text-sm focus:outline-none focus:border-[#2DD4BF]/50" style={{ colorScheme: "dark" }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#8B8AA0] mb-1 block">Nama obat/vaksin</label>
              <input type="text" placeholder="Misal: Vaksin ND La Sota" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] text-sm placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />
            </div>
            <div>
              <label className="text-[11px] text-[#8B8AA0] mb-1 block">Dosis</label>
              <input type="text" placeholder="Misal: 1 tetes/ekor" value={dose} onChange={(e) => setDose(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] text-sm placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#8B8AA0] mb-1 block">Catatan (opsional)</label>
            <input type="text" placeholder="Catatan tambahan..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] text-sm placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] text-sm font-semibold disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan Jadwal"}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-[#8B8AA0]">Batal</button>
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <p className="text-sm text-[#8B8AA0] text-center py-6">Belum ada jadwal kesehatan. Klik "Tambah Jadwal" untuk mulai.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {schedules.map((s) => {
            const isToday = s.scheduled_date === today;
            const isOverdue = s.scheduled_date < today;
            return (
              <div key={s.id} className={"flex items-center justify-between p-3 rounded-xl border " + (isToday ? "border-[#F59E0B]/30 bg-[#F59E0B]/5" : isOverdue ? "border-[#EC4899]/20 bg-[#EC4899]/5" : "border-white/5 bg-[#0A0A12]")}>
                <div className="flex items-center gap-3">
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-sm " + (isToday ? "bg-[#F59E0B]/20" : isOverdue ? "bg-[#EC4899]/20" : "bg-white/5")}>
                    {isToday ? "⏰" : isOverdue ? "⚠️" : "📋"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-[11px] text-[#8B8AA0]">
                      {s.products?.name || "Semua hewan"}
                      {s.medicine_name && ` · ${s.medicine_name}`}
                      {s.dose && ` · ${s.dose}`}
                      <span className="mx-1">·</span>
                      <span style={{ color: isToday ? "#F59E0B" : isOverdue ? "#EC4899" : "#8B8AA0" }}>
                        {isToday ? "Hari ini!" : isOverdue ? "Terlewat!" : new Date(s.scheduled_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDone(s.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[#2DD4BF]/30 text-[#2DD4BF] hover:bg-[#2DD4BF]/10 transition-colors">
                  <Check size={12} /> Selesai
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
