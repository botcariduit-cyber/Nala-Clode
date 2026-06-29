"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Mail, User, Check, Clock, X } from "lucide-react";

type Member = {
  id: string; business_id: string; owner_id: string;
  member_email: string; member_user_id: string | null;
  role: string; status: string; created_at: string;
};

const inputCls = "w-full px-3 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm";

export default function KaryawanClient({ members, userId, businessId }: { members: Member[]; userId: string; businessId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("kasir");
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);

    // Cek apakah email sudah terdaftar di Supabase Auth
    const { data: existingMember } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", businessId)
      .eq("member_email", email)
      .maybeSingle();

    if (existingMember) {
      alert("Email ini sudah diinvite sebelumnya.");
      setLoading(false);
      return;
    }

    // Tambah ke business_members
    const { error } = await supabase.from("business_members").insert({
      business_id: businessId,
      owner_id: userId,
      member_email: email,
      role: role,
      status: "pending",
    });

    if (error) {
      alert("Gagal invite: " + error.message);
      setLoading(false);
      return;
    }

    // Kirim magic link invite via Supabase Auth
    setInviteLoading(true);
    const { error: inviteError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback?type=invite&business_id=" + businessId,
      }
    });

    if (inviteError) {
      console.error("Invite email error:", inviteError);
    }

    setLoading(false);
    setInviteLoading(false);
    setEmail("");
    setShowForm(false);
    router.refresh();
    alert("Undangan berhasil dikirim ke " + email);
  };

  const handleDelete = async (id: string, memberEmail: string) => {
    if (!confirm("Hapus akses karyawan " + memberEmail + "?")) return;
    await supabase.from("business_members").delete().eq("id", id);
    router.refresh();
  };

  const handleActivate = async (id: string) => {
    await supabase.from("business_members").update({ status: "aktif" }).eq("id", id);
    router.refresh();
  };

  const aktif = members.filter(m => m.status === "aktif");
  const pending = members.filter(m => m.status === "pending");

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-[#8B8AA0] mb-1">Total karyawan</p>
          <p className="text-lg font-mono font-semibold text-[#38BDF8]">{members.length}</p>
        </div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-[#8B8AA0] mb-1">Aktif</p>
          <p className="text-lg font-mono font-semibold text-[#2DD4BF]">{aktif.length}</p>
        </div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-[#8B8AA0] mb-1">Menunggu konfirmasi</p>
          <p className="text-lg font-mono font-semibold text-[#F59E0B]">{pending.length}</p>
        </div>
      </div>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="font-medium text-sm">Daftar Karyawan</span>
          <button onClick={() => setShowForm(!showForm)}
            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
            style={{ background: "linear-gradient(to right, #38BDF8, #8B5CF6)", color: "#0A0A12" }}>
            <Plus size={13} /> Invite Karyawan
          </button>
        </div>

        {showForm && (
          <div className="px-4 py-4 border-b border-white/10 bg-[#0A0A12]/40">
            <p className="text-xs font-medium text-[#2DD4BF] mb-3">Invite Karyawan Baru</p>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8AA0]" />
                <input className={inputCls + " pl-8"} type="email" placeholder="Email karyawan" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
                <option value="kasir">Kasir — hanya akses halaman kasir</option>
              </select>
              <div className="bg-[#2DD4BF]/5 border border-[#2DD4BF]/15 rounded-lg px-3 py-2">
                <p className="text-[11px] text-[#8B8AA0]">Karyawan akan menerima email undangan. Setelah klik link di email, mereka bisa login dan langsung akses Kasir.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleInvite} disabled={loading}
                  className="flex-1 py-2 rounded-lg text-[#0A0A12] font-semibold text-sm disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, #38BDF8, #8B5CF6)" }}>
                  {loading ? "Mengirim..." : "Kirim Undangan"}
                </button>
                <button onClick={() => { setShowForm(false); setEmail(""); }} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-[#8B8AA0]">Batal</button>
              </div>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-12">
            <User size={32} className="text-[#3A3B52] mx-auto mb-3" />
            <p className="text-sm text-[#5A5B6A] mb-1">Belum ada karyawan</p>
            <p className="text-xs text-[#3A3B52]">Invite karyawan agar mereka bisa akses Kasir</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {members.map(m => (
              <div key={m.id} className="flex items-center px-4 py-3 gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{ background: m.status === "aktif" ? "rgba(45,212,191,.12)" : "rgba(245,158,11,.12)", color: m.status === "aktif" ? "#2DD4BF" : "#F59E0B" }}>
                  {m.member_email.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F0EFF8] truncate">{m.member_email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                      style={{ background: "rgba(139,92,246,.12)", color: "#8B5CF6" }}>{m.role}</span>
                    <span className={"text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 " + (m.status === "aktif" ? "bg-[#2DD4BF]/10 text-[#2DD4BF]" : "bg-[#F59E0B]/10 text-[#F59E0B]")}>
                      {m.status === "aktif" ? <Check size={9} /> : <Clock size={9} />}
                      {m.status === "aktif" ? "Aktif" : "Menunggu konfirmasi"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.status === "pending" && (
                    <button onClick={() => handleActivate(m.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-[#2DD4BF]/30 text-[#2DD4BF] bg-[#2DD4BF]/08">
                      Aktifkan
                    </button>
                  )}
                  <button onClick={() => handleDelete(m.id, m.member_email)}
                    className="text-[#8B8AA0] hover:text-[#EC4899] p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 bg-[#0F0F1A] border border-white/10 rounded-2xl p-4">
        <p className="text-xs font-medium text-[#8B8AA0] mb-2">Cara kerja sistem karyawan:</p>
        <div className="flex flex-col gap-2">
          {[
            "Owner invite karyawan via email",
            "Karyawan terima email → klik link → daftar/login",
            "Karyawan otomatis terhubung ke bisnis ini",
            "Karyawan login → langsung masuk ke halaman Kasir",
            "Karyawan tidak bisa akses menu lain (Inventory, Keuangan, dll)",
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
