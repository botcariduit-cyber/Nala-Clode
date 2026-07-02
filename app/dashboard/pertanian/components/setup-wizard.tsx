"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { inputCls, cardCls } from "../lib/constants";

const TANAMAN_CHIPS = ["Padi", "Cabai", "Tomat", "Jagung", "Kedelai", "Sayuran", "Buah"];

type Props = {
  businessId: string;
  userId: string;
  onDone: () => void;
};

export default function SetupWizard({ businessId, userId, onDone }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [namaLahan, setNamaLahan] = useState("");
  const [luas, setLuas] = useState("");
  const [tanaman, setTanaman] = useState("");

  const finish = async () => {
    if (!namaLahan.trim() || !luas) return;
    setLoading(true);
    await supabase.from("agri_fields").insert({
      user_id: userId,
      business_id: businessId,
      nama_lahan: namaLahan.trim(),
      luas_lahan: Number(luas),
      jenis_tanaman: tanaman || null,
      tanggal_tanam: new Date().toISOString().split("T")[0],
      status: "pertumbuhan",
    });
    setLoading(false);
    localStorage.setItem(`gercep_agri_setup_${businessId}`, "1");
    onDone();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className={`${cardCls} w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6`}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5 sm:hidden" />
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-emerald-400" />
          <h2 className="text-lg font-semibold">Setup Cepat</h2>
        </div>
        <p className="text-sm text-[#8B8AA0] mb-5">3 langkah, kurang dari 1 menit.</p>

        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-violet-500" : "bg-white/10"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Lahan kamu namanya apa?</p>
            <input className={inputCls} placeholder="Contoh: Sawah Blok A" value={namaLahan} onChange={e => setNamaLahan(e.target.value)} autoFocus />
            <input className={inputCls} type="number" inputMode="decimal" placeholder="Luas (hektar/hektar)" value={luas} onChange={e => setLuas(e.target.value)} />
            <button type="button" disabled={!namaLahan.trim() || !luas} onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2">
              Lanjut <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Tanam apa di lahan ini?</p>
            <div className="flex flex-wrap gap-2">
              {TANAMAN_CHIPS.map(t => (
                <button key={t} type="button" onClick={() => setTanaman(t)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${tanaman === t ? "bg-violet-600 text-white" : "bg-white/[0.06] text-[#8B8AA0] border border-white/10"}`}>
                  {t}
                </button>
              ))}
            </div>
            <input className={inputCls} placeholder="Atau ketik sendiri..." value={tanaman} onChange={e => setTanaman(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-3.5 rounded-2xl border border-white/10 text-[#8B8AA0]"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white flex items-center justify-center gap-2">
                Lanjut <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="text-4xl mb-2">🌾</div>
            <p className="text-sm font-medium">Siap! Lahan <span className="text-emerald-400">{namaLahan}</span> tercatat.</p>
            <p className="text-xs text-[#8B8AA0]">{luas} ha · {tanaman || "—"}</p>
            <p className="text-xs text-[#8B8AA0]">Selanjutnya kamu bisa catat panen, pupuk, atau tanya Gercep.</p>
            <button type="button" disabled={loading} onClick={finish}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-violet-600 font-semibold text-white disabled:opacity-50">
              {loading ? "Menyimpan..." : "Mulai Pakai Gercep AI"}
            </button>
          </div>
        )}

        <button type="button" onClick={() => { localStorage.setItem(`gercep_agri_setup_${businessId}`, "1"); onDone(); }}
          className="w-full mt-3 text-xs text-[#5A5B7A] py-2">Lewati setup</button>
      </div>
    </div>
  );
}
