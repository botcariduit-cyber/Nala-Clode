"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Minus, Search, Check, LogIn, LogOut, User, ShoppingCart, Trash2 } from "lucide-react";

import { calcHpp } from "../lib/calc";
import type { FnbMenu } from "../lib/calc";
import { validateCartStock, deductStockForSale } from "../lib/process-order";
import FnbHubNav from "../components/fnb-hub-nav";
import FnbKpiRow from "../components/fnb-kpi-row";
import FnbStockAlerts from "../components/fnb-stock-alerts";

type Checkin = { id: string; tanggal: string; jam_masuk: string; jam_keluar: string | null };
type Employee = { id: string; nama: string; jabatan: string | null; checkins: Checkin[] };
type CartItem = { menu: FnbMenu; qty: number };

const KATEGORI_COLOR: Record<string, string> = { "Makanan": "#2DD4BF", "Minuman": "#38BDF8", "Snack": "#F59E0B", "Paket": "#8B5CF6", "Lainnya": "#8B8AA0" };
const KATEGORI_ICON: Record<string, string> = { "Makanan": "ti-bowl-chopsticks", "Minuman": "ti-glass", "Snack": "ti-cookie", "Paket": "ti-package", "Lainnya": "ti-dots" };

export default function KasirClient({ menus, employees, userId, businessId, omzetHariIni, labaHariIni, totalOrder, today }: {
  menus: FnbMenu[]; employees: Employee[]; userId: string; businessId: string;
  omzetHariIni: number; labaHariIni: number; totalOrder: number; today: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Semua");
  const [diskon, setDiskon] = useState("");
  const [metodeBayar, setMetodeBayar] = useState("tunai");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinEmployee, setPinEmployee] = useState<Employee | null>(null);
  const [checkinLoading, setCheckinLoading] = useState("");

  const todayCheckins = employees.map(e => ({
    ...e,
    checkedIn: e.checkins.some(c => c.tanggal === today && !c.jam_keluar),
    checkinTime: e.checkins.find(c => c.tanggal === today)?.jam_masuk || null,
  }));

  const filtered = useMemo(() => {
    return menus.filter(m =>
      m.nama.toLowerCase().includes(search.toLowerCase()) &&
      (activeTab === "Semua" || m.kategori === activeTab)
    );
  }, [menus, search, activeTab]);

  const categories = ["Semua", ...Array.from(new Set(menus.map(m => m.kategori || "Lainnya")))];

  const addToCart = (menu: FnbMenu) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu.id === menu.id);
      if (existing) return prev.map(c => c.menu.id === menu.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { menu, qty: 1 }];
    });
  };

  const removeFromCart = (menuId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu.id === menuId);
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter(c => c.menu.id !== menuId);
      return prev.map(c => c.menu.id === menuId ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const getQty = (menuId: string) => cart.find(c => c.menu.id === menuId)?.qty || 0;

  const subtotal = cart.reduce((s, c) => s + c.menu.harga_jual * c.qty, 0);
  const totalHpp = cart.reduce((s, c) => s + calcHpp(c.menu) * c.qty, 0);
  const diskonNum = Number(diskon) || 0;
  const total = Math.max(0, subtotal - diskonNum);
  const laba = total - totalHpp;
  const margin = total > 0 ? Math.round(laba / total * 100) : 0;

  const handleCheckin = async (emp: Employee) => {
    setCheckinLoading(emp.id);
    const isIn = todayCheckins.find(e => e.id === emp.id)?.checkedIn;
    if (isIn) {
      const checkin = emp.checkins.find(c => c.tanggal === today && !c.jam_keluar);
      if (checkin) {
        await supabase.from("checkins").update({ jam_keluar: new Date().toTimeString().slice(0, 5) }).eq("id", checkin.id);
      }
    } else {
      await supabase.from("checkins").insert({ employee_id: emp.id, business_id: businessId, tanggal: today, jam_masuk: new Date().toTimeString().slice(0, 5) });
    }
    setCheckinLoading("");
    router.refresh();
  };

  const handleProses = async () => {
    if (cart.length === 0) return;

    const stockCheck = validateCartStock(cart);
    if (!stockCheck.ok) {
      alert(stockCheck.message);
      return;
    }

    setLoading(true);

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: userId, business_id: businessId,
      total, diskon: diskonNum, hpp: totalHpp, laba,
      metode_bayar: metodeBayar, catatan: catatan || null,
      order_date: today,
    }).select("id").single();

    if (error || !order) { alert("Gagal simpan order: " + error?.message); setLoading(false); return; }

    const items = cart.map(c => ({
      order_id: order.id, menu_id: c.menu.id, qty: c.qty,
      harga_jual: c.menu.harga_jual, hpp: calcHpp(c.menu), laba: (c.menu.harga_jual - calcHpp(c.menu)) * c.qty,
    }));
    await supabase.from("order_items").insert(items);

    await deductStockForSale(supabase, cart, userId, { today, notePrefix: "Kasir" });

    await supabase.from("transactions").insert({
      user_id: userId, business_id: businessId,
      type: "pemasukan", scope: "bisnis",
      category: "Penjualan F&B",
      description: cart.map(c => c.menu.nama + " x" + c.qty).join(", "),
      amount: total, transaction_date: today,
    });

    setCart([]); setDiskon(""); setCatatan(""); setMetodeBayar("tunai");
    setLoading(false);
    router.refresh();
    alert("Transaksi berhasil! Total: Rp" + total.toLocaleString("id-ID"));
  };

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm focus:outline-none";

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <FnbHubNav />
      <FnbKpiRow items={[
        { label: "Omzet hari ini", value: "Rp" + (omzetHariIni / 1000).toFixed(0) + "rb", color: "#2DD4BF" },
        { label: "Total order", value: String(totalOrder), color: "#8B5CF6" },
        { label: "Laba hari ini", value: "Rp" + (labaHariIni / 1000).toFixed(0) + "rb", color: "#F59E0B" },
        { label: "Margin", value: omzetHariIni > 0 ? Math.round(labaHariIni / omzetHariIni * 100) + "%" : "—", color: "#38BDF8" },
      ]} />

      <div className="bg-[#0F0F1A] border border-white/[0.06] rounded-2xl p-4 mb-6">
        <p className="text-[10px] font-medium text-[#2DD4BF] tracking-widest uppercase mb-3">Check-in karyawan — {today}</p>
        {employees.length === 0 ? (
          <p className="text-xs text-[#5A5B6A] text-center py-4">Belum ada karyawan. Tambah karyawan dulu.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {todayCheckins.map(emp => (
              <div key={emp.id} className="flex items-center gap-3 bg-[#0A0A12] rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: emp.checkedIn ? "rgba(45,212,191,.12)" : "rgba(255,255,255,.04)", color: emp.checkedIn ? "#2DD4BF" : "#5A5B7A" }}>
                  {emp.nama.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#F0EFF8]">{emp.nama}</p>
                  <p className="text-[10px] text-[#5A5B7A]">
                    {emp.jabatan || "Karyawan"}
                    {emp.checkinTime && <span style={{ color: "#8B8AA0", fontFamily: "monospace" }}> · masuk {emp.checkinTime}</span>}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ background: emp.checkedIn ? "#2DD4BF" : "#F59E0B" }}></div>
                <button
                  onClick={() => handleCheckin(emp)}
                  disabled={checkinLoading === emp.id}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium"
                  style={emp.checkedIn
                    ? { borderColor: "rgba(236,72,153,.3)", color: "#EC4899", background: "rgba(236,72,153,.06)" }
                    : { borderColor: "rgba(45,212,191,.3)", color: "#2DD4BF", background: "rgba(45,212,191,.06)" }
                  }
                >
                  {checkinLoading === emp.id ? "..." : emp.checkedIn ? "Check-out" : "Check-in"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="bg-[#0F0F1A] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
            <Search size={14} className="text-[#5A5B7A] flex-shrink-0" />
            <input type="text" placeholder="Cari menu..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#F0EFF8] placeholder:text-[#3A3B52] focus:outline-none" />
          </div>
          <div className="flex gap-2 px-4 py-2.5 border-b border-white/[0.06] overflow-x-auto">
            {categories.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={"text-[11px] px-3 py-1 rounded-full border whitespace-nowrap " + (activeTab === tab ? "" : "border-white/[0.08] text-[#5A5B7A]")}
                style={activeTab === tab ? { borderColor: "rgba(45,212,191,.45)", color: "#2DD4BF", background: "rgba(45,212,191,.08)" } : {}}>
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
            {filtered.length === 0 ? (
              <p className="text-xs text-[#5A5B6A] text-center py-8 col-span-3">Tidak ada menu.</p>
            ) : filtered.map(m => {
              const hpp = calcHpp(m);
              const margin = m.harga_jual > 0 ? Math.round((m.harga_jual - hpp) / m.harga_jual * 100) : 0;
              const qty = getQty(m.id);
              const kat = m.kategori || "Lainnya";
              const color = KATEGORI_COLOR[kat] || "#8B8AA0";
              const icon = KATEGORI_ICON[kat] || "ti-dots";
              return (
                <div key={m.id} className="bg-[#0A0A12] border rounded-2xl overflow-hidden cursor-pointer"
                  style={{ borderColor: qty > 0 ? "rgba(45,212,191,.4)" : "rgba(255,255,255,0.06)" }}
                  onClick={() => addToCart(m)}>
                  <div className="flex items-center justify-center py-6" style={{ background: color + "10" }}>
                    <i className={"ti " + icon} style={{ fontSize: "36px", color }} aria-hidden="true"></i>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: color + "15", color }}>{kat}</span>
                    <p className="text-sm font-medium text-[#F0EFF8] mb-1">{m.nama}</p>
                    <p className="text-[10px] text-[#5A5B7A] mb-2">HPP Rp{Math.round(hpp).toLocaleString("id-ID")} · {margin}%</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold" style={{ color: "#2DD4BF", fontFamily: "JetBrains Mono, monospace" }}>Rp{m.harga_jual.toLocaleString("id-ID")}</p>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => removeFromCart(m.id)} className="w-6 h-6 rounded-lg flex items-center justify-center border"
                          style={qty > 0 ? { borderColor: "rgba(45,212,191,.4)", color: "#2DD4BF", background: "rgba(45,212,191,.08)" } : { borderColor: "rgba(255,255,255,.08)", color: "#5A5B7A" }}>
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-medium w-5 text-center" style={{ color: qty > 0 ? "#2DD4BF" : "#3A3B52", fontFamily: "monospace" }}>{qty}</span>
                        <button onClick={() => addToCart(m)} className="w-6 h-6 rounded-lg flex items-center justify-center border"
                          style={{ borderColor: "rgba(45,212,191,.4)", color: "#2DD4BF", background: "rgba(45,212,191,.08)" }}>
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0F0F1A] border border-white/[0.06] rounded-2xl overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] font-medium text-[#2DD4BF] tracking-widest uppercase mb-3">Order aktif</p>
            {cart.length === 0 ? (
              <p className="text-xs text-[#3A3B52] text-center py-4">Pilih menu di sebelah kiri</p>
            ) : (
              <div className="flex flex-col gap-1.5 mb-3">
                {cart.map(c => (
                  <div key={c.menu.id} className="flex items-center justify-between text-xs">
                    <span className="text-[#8B8AA0] flex-1 min-w-0 truncate">{c.menu.nama} ×{c.qty}</span>
                    <span style={{ fontFamily: "monospace", color: "#C4C3D4" }}>Rp{(c.menu.harga_jual * c.qty).toLocaleString("id-ID")}</span>
                    <button onClick={() => setCart(prev => prev.filter(x => x.menu.id !== c.menu.id))} className="ml-2 text-[#5A5B7A] hover:text-[#EC4899]"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="h-px bg-white/[0.06] mb-2"></div>
            <div className="flex justify-between text-xs mb-1.5"><span className="text-[#5A5B7A]">Subtotal</span><span style={{ fontFamily: "monospace", color: "#C4C3D4" }}>Rp{subtotal.toLocaleString("id-ID")}</span></div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-[#5A5B7A]">Diskon</span>
              <div className="flex items-center gap-1">
                <input type="number" placeholder="0" value={diskon} onChange={e => setDiskon(e.target.value)}
                  className="w-20 text-right text-xs px-2 py-1 rounded-lg border border-white/[0.08] bg-[#0A0A12] text-[#F0EFF8] focus:outline-none" style={{ fontFamily: "monospace" }} />
                <span className="text-[10px] text-[#5A5B7A]">Rp</span>
              </div>
            </div>
            <div className="h-px bg-white/[0.06] mb-2"></div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-medium text-[#F0EFF8]">Total</span>
              <span className="text-base font-semibold" style={{ color: "#2DD4BF", fontFamily: "JetBrains Mono, monospace" }}>Rp{total.toLocaleString("id-ID")}</span>
            </div>
            <p className="text-[10px] text-[#5A5B7A]">Laba <span style={{ color: "#2DD4BF" }}>Rp{Math.round(laba).toLocaleString("id-ID")}</span> · margin {margin}%</p>
          </div>

          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] text-[#5A5B7A] tracking-widest uppercase mb-2">Metode bayar</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ val: "tunai", lbl: "Tunai", icon: "ti-cash" }, { val: "qris", lbl: "QRIS", icon: "ti-qrcode" }, { val: "transfer", lbl: "Transfer", icon: "ti-credit-card" }].map(m => (
                <button key={m.val} onClick={() => setMetodeBayar(m.val)}
                  className="py-2 rounded-lg border text-center text-xs font-medium"
                  style={metodeBayar === m.val ? { borderColor: "rgba(45,212,191,.45)", color: "#2DD4BF", background: "rgba(45,212,191,.08)" } : { borderColor: "rgba(255,255,255,.08)", color: "#5A5B7A" }}>
                  <i className={"ti " + m.icon} style={{ fontSize: "14px", display: "block", marginBottom: "2px" }} aria-hidden="true"></i>
                  {m.lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] text-[#5A5B7A] tracking-widest uppercase mb-2">Catatan</p>
            <input type="text" placeholder="Meja 3, extra pedas..." value={catatan} onChange={e => setCatatan(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-white/[0.08] bg-[#0A0A12] text-[#F0EFF8] placeholder:text-[#3A3B52] focus:outline-none" />
          </div>

          <div className="px-4 py-4 flex flex-col gap-2">
            <button onClick={handleProses} disabled={loading || cart.length === 0}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #2DD4BF, #8B5CF6)", color: "#070711" }}>
              <Check size={15} />
              {loading ? "Memproses..." : "Proses — Rp" + total.toLocaleString("id-ID")}
            </button>
            <button onClick={() => { setCart([]); setDiskon(""); setCatatan(""); }}
              className="w-full py-2 rounded-xl text-xs border font-medium"
              style={{ borderColor: "rgba(236,72,153,.25)", color: "#EC4899", background: "rgba(236,72,153,.05)" }}>
              Reset order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
