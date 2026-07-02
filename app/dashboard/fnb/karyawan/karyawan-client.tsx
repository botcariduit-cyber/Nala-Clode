"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Copy, User, ExternalLink } from "lucide-react";

type Employee = {
  id: string; nama: string; jabatan: string | null;
  kasir_token: string; aktif: boolean; created_at: string;
};

const inputCls = "w-full px-3 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm";

import FnbHubNav from "../components/fnb-hub-nav";

export default function KaryawanClient({ employees, userId, businessId }: { employees: Employee[]; userId: string; businessId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleTambah = async () => {
    if (!nama) return;
    setLoading(true);
    const { error } = await supabase.from("employees").insert({
      business_id: businessId,
      user_id: userId,
      nama, jabatan: jabatan || null,
      aktif: true,
    });
    if (error) { alert("Gagal: " + error.message); setLoading(false); return; }
    setLoading(false);
    setNama(""); setJabatan("");
    setShowForm(false);
    router.refresh();
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm("Hapus karyawan " + nama + "? Link kasir mereka akan nonaktif.")) return;
    await supabase.from("employees").update({ aktif: false }).eq("id", id);
    router.refresh();
  };

  const copyLink = (token: string) => {
    const url = window.location.origin + "/kasir/" + token;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const getLink = (token: string) => window.location.origin + "/kasir/" + token;

  const aktif = employees.filter(e => e.aktif);

  return (
    <div>
      <FnbHubNav />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-[#8B8AA0] mb-1">Total karyawan</p>
          <p className="text-lg font-mono font-semibold text-[#38BDF8]">{employees.length}</p>
        </div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-[#8B8AA0] mb-1">Aktif</p>
          <p className="text-lg font-mono font-semibold text-[#2DD4BF]">{aktif.length}</p>
        </div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-[#8B8AA0] mb-1">Link kasir</p>
          <p className="text-lg font-mono font-semibold text-[#8B5CF6]">{aktif.length}</p>
        </div>
      </div>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="font-medium text-sm">Daftar Karyawan</span>
          <button onClick={() => setShowForm(!showForm)}
            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
            style={{ background: "linear-gradient(to right, #38BDF8, #8B5CF6)", color: "#0A0A12" }}>
            <Plus size={13} /> Tambah Karyawan
          </button>
        </div>

        {showForm && (
          <div className="px-4 py-4 border-b border-white/10 bg-[#0A0A12]/40">
            <p className="text-xs font-medium text-[#2DD4BF] mb-3">Karyawan Baru</p>
            <div className="flex flex-col gap-2">
              <input className={inputCls} placeholder="Nama karyawan" value={nama} onChange={e => setNama(e.target.value)} />
              <input className={inputCls} placeholder="Jabatan (Kasir, Barista, Pelayan...)" value={jabatan} onChange={e => setJabatan(e.target.value)} />
              <div className="bg-[#2DD4BF]/5 border border-[#2DD4BF]/15 rounded-lg px-3 py-2">
                <p className="text-[11px] text-[#8B8AA0]">Setelah ditambah, sistem akan generate link kasir unik untuk karyawan ini. Bagikan link ke HP karyawan untuk akses kasir.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleTambah} disabled={loading}
                  className="flex-1 py-2 rounded-lg text-[#0A0A12] font-semibold text-sm disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, #38BDF8, #8B5CF6)" }}>
                  {loading ? "Menyimpan..." : "Tambah Karyawan"}
                </button>
                <button onClick={() => { setShowForm(false); setNama(""); setJabatan(""); }} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-[#8B8AA0]">Batal</button>
              </div>
            </div>
          </div>
        )}

        {employees.length === 0 ? (
          <div className="text-center py-12">
            <User size={32} className="text-[#3A3B52] mx-auto mb-3" />
            <p className="text-sm text-[#5A5B6A] mb-1">Belum ada karyawan</p>
            <p className="text-xs text-[#3A3B52]">Tambah karyawan untuk generate link kasir</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {employees.map(emp => (
              <div key={emp.id} className="px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                    style={{ background: emp.aktif ? "rgba(45,212,191,.12)" : "rgba(255,255,255,.04)", color: emp.aktif ? "#2DD4BF" : "#5A5B7A" }}>
                    {emp.nama.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#F0EFF8]">{emp.nama}</p>
                    <p className="text-[11px] text-[#5A5B7A]">{emp.jabatan || "Karyawan"}</p>
                  </div>
                  <span className={"text-[10px] px-2 py-0.5 rounded-full " + (emp.aktif ? "bg-[#2DD4BF]/10 text-[#2DD4BF]" : "bg-white/5 text-[#8B8AA0]")}>
                    {emp.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                  <button onClick={() => handleDelete(emp.id, emp.nama)} className="text-[#8B8AA0] hover:text-[#EC4899] p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="bg-[#0A0A12] border border-white/[0.06] rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-[#5A5B7A] mb-1.5 uppercase tracking-wide">Link kasir karyawan ini</p>
                  <p className="text-[11px] font-mono text-[#2DD4BF] mb-2 truncate">{getLink(emp.kasir_token)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => copyLink(emp.kasir_token)}
                      className="flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1.5 font-medium"
                      style={{ borderColor: copied === emp.kasir_token ? "rgba(45,212,191,.4)" : "rgba(255,255,255,.1)", color: copied === emp.kasir_token ? "#2DD4BF" : "#8B8AA0", background: copied === emp.kasir_token ? "rgba(45,212,191,.08)" : "rgba(255,255,255,.03)" }}>
                      <Copy size={11} />
                      {copied === emp.kasir_token ? "Tersalin!" : "Salin link"}
                    </button>
                    <a href={getLink(emp.kasir_token)} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-[#8B8AA0] flex items-center gap-1.5 hover:text-[#F0EFF8]">
                      <ExternalLink size={11} /> Buka
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4">
        <p className="text-xs font-medium text-[#8B8AA0] mb-2">Cara kerja:</p>
        <div className="flex flex-col gap-2">
          {[
            "Tambah karyawan → sistem generate link kasir unik",
            "Bagikan link ke HP karyawan via WhatsApp/chat",
            "Karyawan buka link → daftarkan sidik jari di HP mereka",
            "Berikutnya cukup scan sidik jari → langsung masuk kasir",
            "Karyawan hanya bisa akses kasir, tidak bisa lihat data lain",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5"
                style={{ background: "rgba(45,212,191,.15)", color: "#2DD4BF" }}>{i + 1}</span>
              <p className="text-xs text-[#8B8AA0]">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
