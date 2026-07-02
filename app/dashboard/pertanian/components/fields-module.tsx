"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit2, MapPin } from "lucide-react";
import type { AgriField } from "../lib/types";
import { FIELD_STATUS, inputCls, cardCls } from "../lib/constants";

type Props = { fields: AgriField[]; userId: string; businessId: string; compact?: boolean };

function plantAge(tanggalTanam: string | null) {
  if (!tanggalTanam) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(tanggalTanam).getTime()) / 86400000));
}

export default function FieldsModule({ fields, userId, businessId, compact }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [fNama, setFNama] = useState("");
  const [fLuas, setFLuas] = useState("");
  const [fLokasi, setFLokasi] = useState("");
  const [fTanaman, setFTanaman] = useState("");
  const [fVarietas, setFVarietas] = useState("");
  const [fTanam, setFTanam] = useState("");
  const [fStatus, setFStatus] = useState("persemaian");
  const [fCatatan, setFCatatan] = useState("");

  const reset = () => {
    setFNama(""); setFLuas(""); setFLokasi(""); setFTanaman(""); setFVarietas("");
    setFTanam(""); setFStatus("persemaian"); setFCatatan(""); setEditId(null); setShowForm(false);
  };

  const openEdit = (f: AgriField) => {
    setEditId(f.id); setFNama(f.nama_lahan); setFLuas(String(f.luas_lahan));
    setFLokasi(f.lokasi || ""); setFTanaman(f.jenis_tanaman || ""); setFVarietas(f.varietas || "");
    setFTanam(f.tanggal_tanam || ""); setFStatus(f.status); setFCatatan(f.catatan || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!fNama || !fLuas) return;
    setLoading(true);
    const payload = {
      user_id: userId, business_id: businessId, nama_lahan: fNama,
      luas_lahan: Number(fLuas), lokasi: fLokasi || null,
      jenis_tanaman: fTanaman || null, varietas: fVarietas || null,
      tanggal_tanam: fTanam || null, status: fStatus, catatan: fCatatan || null,
    };
    if (editId) await supabase.from("agri_fields").update(payload).eq("id", editId);
    else await supabase.from("agri_fields").insert(payload);
    setLoading(false); reset(); router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data lahan?")) return;
    await supabase.from("agri_fields").delete().eq("id", id);
    router.refresh();
  };

  const totalLuas = fields.reduce((s, f) => s + Number(f.luas_lahan), 0);
  const statusInfo = (s: string) => FIELD_STATUS.find(f => f.value === s) || FIELD_STATUS[0];

  return (
    <div className="space-y-4">
      {!compact && (
      <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className={`${cardCls} p-4`}><p className="text-[10px] text-[#8B8AA0]">Total Lahan</p><p className="text-xl font-semibold">{fields.length}</p></div>
        <div className={`${cardCls} p-4`}><p className="text-[10px] text-[#8B8AA0]">Total Luas</p><p className="text-xl font-semibold">{totalLuas} ha</p></div>
        <div className={`${cardCls} p-4`}><p className="text-[10px] text-[#8B8AA0]">Siap Panen</p><p className="text-xl font-semibold text-emerald-400">{fields.filter(f => f.status === "siap_panen").length}</p></div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={() => { reset(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white">
          <Plus size={14} /> Tambah Lahan
        </button>
      </div>

      {showForm && (
        <div className={`${cardCls} p-5 fade-up`}>
          <h3 className="text-sm font-semibold mb-4">{editId ? "Edit" : "Tambah"} Lahan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Nama Lahan *" value={fNama} onChange={e => setFNama(e.target.value)} />
            <input className={inputCls} type="number" placeholder="Luas Lahan (ha) *" value={fLuas} onChange={e => setFLuas(e.target.value)} />
            <input className={inputCls} placeholder="Lokasi" value={fLokasi} onChange={e => setFLokasi(e.target.value)} />
            <input className={inputCls} placeholder="Jenis Tanaman" value={fTanaman} onChange={e => setFTanaman(e.target.value)} />
            <input className={inputCls} placeholder="Varietas" value={fVarietas} onChange={e => setFVarietas(e.target.value)} />
            <input className={inputCls} type="date" value={fTanam} onChange={e => setFTanam(e.target.value)} />
            <select className={inputCls} value={fStatus} onChange={e => setFStatus(e.target.value)}>
              {FIELD_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <textarea className={inputCls} rows={2} placeholder="Catatan" value={fCatatan} onChange={e => setFCatatan(e.target.value)} />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan"}</button>
            <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl border border-white/10 text-sm text-[#8B8AA0]">Batal</button>
          </div>
        </div>
      )}
      </>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {fields.length === 0 ? (
          <div className={`${cardCls} p-8 text-center text-sm text-[#8B8AA0] sm:col-span-2`}>{compact ? "Belum ada data. Buka tab Catat untuk tambah." : "Belum ada lahan terdaftar."}</div>
        ) : fields.map(f => {
          const st = statusInfo(f.status);
          const age = plantAge(f.tanggal_tanam);
          return (
            <div key={f.id} className={`${cardCls} p-5 hover:border-violet-500/20 transition-colors`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-violet-400" />
                  <div>
                    <p className="font-semibold">{f.nama_lahan}</p>
                    <p className="text-xs text-[#8B8AA0]">{f.luas_lahan} ha · {f.lokasi || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => openEdit(f)} className="p-1.5 text-[#8B8AA0] hover:text-violet-400"><Edit2 size={14} /></button>
                  <button type="button" onClick={() => handleDelete(f.id)} className="p-1.5 text-[#8B8AA0] hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm mb-1">{f.jenis_tanaman || "—"} {f.varietas ? `· ${f.varietas}` : ""}</p>
              <p className="text-[11px] text-[#8B8AA0] mb-3">Umur: {age !== null ? `${age} hari` : "—"} · {st.label}</p>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all" style={{ width: `${st.progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
