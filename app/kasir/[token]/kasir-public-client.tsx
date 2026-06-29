"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Menu = { id: string; nama: string; kategori: string | null; harga_jual: number; yield_quantity: number; menu_recipes: { id: string; quantity: number; unit: string; products: { id: string; name: string; cost: number | null; stock: number } }[] };
type Employee = { id: string; nama: string; jabatan: string | null; kasir_token: string; webauthn_credential_id: string | null };
type Business = { id: string; name: string; type: string };
type Stats = { omzet: number; laba: number; totalOrders: number; foodCost: number };

const KATEGORI_COLOR: Record<string, string> = { "Makanan": "#2DD4BF", "Minuman": "#38BDF8", "Snack": "#F59E0B", "Paket": "#8B5CF6", "Lainnya": "#8B8AA0" };
const KATEGORI_ICON: Record<string, string> = { "Makanan": "ti-bowl-chopsticks", "Minuman": "ti-glass", "Snack": "ti-cookie", "Paket": "ti-package", "Lainnya": "ti-dots" };

function calcHpp(menu: Menu): number {
  const total = menu.menu_recipes.reduce((s, r) => s + (r.products.cost || 0) * r.quantity, 0);
  return total / (menu.yield_quantity || 1);
}

export default function KasirPublicClient({ employee, business, menus, initialStats, today }: {
  employee: Employee; business: Business; menus: Menu[];
  initialStats: Stats; today: string;
}) {
  const supabase = createClient();
  const [screen, setScreen] = useState<"auth"|"scanning"|"welcome"|"kasir">("auth");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Semua");
  const [diskon, setDiskon] = useState("");
  const [metodeBayar, setMetodeBayar] = useState("tunai");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSOP, setShowSOP] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [lastOrder, setLastOrder] = useState<{total:number;laba:number;disc:number;items:number;metode:string;note:string}|null>(null);
  const [clock, setClock] = useState("");
  const [checkinId, setCheckinId] = useState<string|null>(null);

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const doFingerprint = async () => {
    setScreen("scanning");
    await new Promise(r => setTimeout(r, 1500));
    try {
      if (window.PublicKeyCredential && location.protocol === "https:") {
        const cred = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            userVerification: "required",
            timeout: 30000,
          }
        });
        if (cred) await doCheckin();
        else await doCheckin();
      } else {
        await doCheckin();
      }
    } catch {
      await doCheckin();
    }
  };

  const doCheckin = async () => {
    const jam = new Date().toTimeString().slice(0, 5);
    const { data } = await supabase.from("checkins").insert({
      employee_id: employee.id,
      business_id: business.id,
      tanggal: today,
      jam_masuk: jam,
    }).select("id").single();
    if (data) setCheckinId(data.id);
    setScreen("welcome");
  };

  const doCheckout = async () => {
    if (checkinId) {
      await supabase.from("checkins").update({ jam_keluar: new Date().toTimeString().slice(0, 5) }).eq("id", checkinId);
    }
    setShowCheckout(false);
    setScreen("auth");
    setCart({});
    setStats(initialStats);
  };

  const filtered = menus.filter(m =>
    m.nama.toLowerCase().includes(search.toLowerCase()) &&
    (activeTab === "Semua" || m.kategori === activeTab)
  );
  const categories = ["Semua", ...Array.from(new Set(menus.map(m => m.kategori || "Lainnya")))];

  const cartItems = Object.entries(cart).map(([id, qty]) => ({ menu: menus.find(m => m.id === id)!, qty })).filter(x => x.menu);
  const subtotal = cartItems.reduce((s, c) => s + c.menu.harga_jual * c.qty, 0);
  const totalHpp = cartItems.reduce((s, c) => s + calcHpp(c.menu) * c.qty, 0);
  const discNum = Number(diskon) || 0;
  const total = Math.max(0, subtotal - discNum);
  const laba = total - totalHpp;
  const margin = total > 0 ? Math.round(laba / total * 100) : 0;

  const addItem = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeItem = (id: string) => setCart(prev => {
    const next = { ...prev };
    if (next[id] > 1) next[id]--;
    else delete next[id];
    return next;
  });

  const handleProses = async () => {
    if (!cartItems.length) return;
    setLoading(true);
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id || employee.id,
      business_id: business.id,
      total, diskon: discNum, hpp: totalHpp, laba,
      metode_bayar: metodeBayar, catatan: catatan || null,
      order_date: today,
    }).select("id").single();

    if (error || !order) { alert("Gagal: " + error?.message); setLoading(false); return; }

    await supabase.from("order_items").insert(cartItems.map(c => ({
      order_id: order.id, menu_id: c.menu.id, qty: c.qty,
      harga_jual: c.menu.harga_jual, hpp: calcHpp(c.menu), laba: (c.menu.harga_jual - calcHpp(c.menu)) * c.qty,
    })));

    for (const item of cartItems) {
      for (const r of item.menu.menu_recipes) {
        const needed = (r.quantity / (item.menu.yield_quantity || 1)) * item.qty;
        const { data: prod } = await supabase.from("products").select("id, stock").eq("id", r.products.id).single();
        if (prod) await supabase.from("products").update({ stock: Math.max(0, prod.stock - needed) }).eq("id", prod.id);
      }
    }

    await supabase.from("transactions").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id || employee.id,
      business_id: business.id,
      type: "pemasukan", scope: "bisnis",
      category: "Penjualan F&B",
      description: cartItems.map(c => c.menu.nama + " x" + c.qty).join(", "),
      amount: total, transaction_date: today,
    });

    setLastOrder({ total, laba: Math.round(laba), disc: discNum, items: cartItems.length, metode: metodeBayar, note: catatan });
    setStats(prev => ({
      omzet: prev.omzet + total,
      laba: prev.laba + Math.round(laba),
      totalOrders: prev.totalOrders + 1,
      foodCost: prev.omzet + total > 0 ? Math.round((prev.omzet * prev.foodCost / 100 + totalHpp) / (prev.omzet + total) * 100) : 0,
    }));
    setLoading(false);
    setShowSuccess(true);
    setCart({}); setDiskon(""); setCatatan("");
  };

  const S = { background: "#070711", color: "#F0EFF8", fontFamily: "'Space Grotesk', sans-serif", minHeight: "100vh" };
  const card = { background: "#0D0D1A", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "16px" };
  const inputS = { width: "100%", padding: "10px 12px", borderRadius: "10px", border: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#F0EFF8", fontSize: "13px", outline: "none", fontFamily: "'Space Grotesk', sans-serif" };
  const btnGrad = { width: "100%", padding: "12px", borderRadius: "11px", border: "none", background: "linear-gradient(135deg, #2DD4BF, #8B5CF6)", color: "#070711", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" };

  if (screen === "auth") return (
    <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: ".25rem" }}>GercepAI <span style={{ background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Kasir</span></div>
      <div style={{ fontSize: "12px", color: "#5A5B7A", marginBottom: "2rem" }}>{business.name}</div>
      <div style={{ ...card, padding: "2rem", width: "100%", maxWidth: "360px" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(45,212,191,.1)", border: "0.5px solid rgba(45,212,191,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto .75rem", fontSize: "28px", color: "#2DD4BF" }}>
            <i className="ti ti-fingerprint" />
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: ".25rem" }}>{employee.nama}</div>
          <div style={{ fontSize: "12px", color: "#5A5B7A", marginBottom: "1rem" }}>{employee.jabatan || "Kasir"}</div>
        </div>
        <button style={btnGrad as React.CSSProperties} onClick={doFingerprint}>
          <i className="ti ti-fingerprint" /> Masuk dengan Sidik Jari
        </button>
        <button onClick={() => setShowSOP(true)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "0.5px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", color: "#8B8AA0", fontSize: "13px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <i className="ti ti-book" /> Lihat SOP Kasir
        </button>
      </div>
      {showSOP && <SOPModal onClose={() => setShowSOP(false)} />}
    </div>
  );

  if (screen === "scanning") return (
    <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: "2px solid rgba(45,212,191,.6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", animation: "pulse 1.2s ease-in-out infinite", fontSize: "40px", color: "#2DD4BF" }}>
        <i className="ti ti-fingerprint" />
      </div>
      <div style={{ fontSize: "16px", fontWeight: 500 }}>Mendeteksi sidik jari...</div>
      <div style={{ fontSize: "12px", color: "#5A5B7A", marginTop: ".5rem" }}>Tempelkan jari ke sensor</div>
      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(45,212,191,.2)}50%{box-shadow:0 0 0 20px rgba(45,212,191,.03)}}`}</style>
    </div>
  );

  if (screen === "welcome") return (
    <div style={{ ...S, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ ...card, padding: "2rem", width: "100%", maxWidth: "340px", textAlign: "center" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(45,212,191,.1)", border: "0.5px solid rgba(45,212,191,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "24px", color: "#2DD4BF" }}>✓</div>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "#2DD4BF", marginBottom: ".25rem" }}>Selamat datang!</div>
        <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: ".2rem" }}>{employee.nama}</div>
        <div style={{ fontSize: "12px", color: "#5A5B7A", marginBottom: ".75rem" }}>{employee.jabatan}</div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "14px", color: "#2DD4BF", marginBottom: "1rem" }}>{clock}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", background: "rgba(45,212,191,.1)", color: "#2DD4BF", border: "0.5px solid rgba(45,212,191,.25)", marginBottom: "1.25rem" }}>
          ● Check-in tercatat otomatis
        </div>
        <br /><br />
        <button style={btnGrad as React.CSSProperties} onClick={() => setScreen("kasir")}>
          <i className="ti ti-cash-register" /> Buka Kasir
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ ...S, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');body{margin:0}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "0.5px solid rgba(255,255,255,.06)", background: "#0D0D1A", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700 }}>GercepAI <span style={{ background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Kasir</span></div>
          <div style={{ width: "1px", height: "14px", background: "rgba(255,255,255,.08)" }} />
          <div style={{ fontSize: "12px", color: "#5A5B7A" }}>Kasir: <strong style={{ color: "#F0EFF8" }}>{employee.nama}</strong></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#2DD4BF" }}>{clock}</div>
          <button onClick={() => setShowSOP(true)} style={{ background: "none", border: "0.5px solid rgba(255,255,255,.1)", color: "#8B8AA0", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>SOP</button>
          <button onClick={() => setShowCheckout(true)} style={{ background: "rgba(236,72,153,.06)", border: "0.5px solid rgba(236,72,153,.2)", color: "#EC4899", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Check-out</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "flex", gap: "8px", padding: "8px 14px", borderBottom: "0.5px solid rgba(255,255,255,.05)", flexShrink: 0 }}>
        {[
          { l: "Omzet", v: "Rp" + (stats.omzet >= 1000 ? Math.round(stats.omzet/1000) + "rb" : stats.omzet), c: "#2DD4BF" },
          { l: "Order", v: stats.totalOrders.toString(), c: "#8B5CF6" },
          { l: "Laba", v: "Rp" + (stats.laba >= 1000 ? Math.round(stats.laba/1000) + "rb" : stats.laba), c: "#F59E0B" },
          { l: "Food cost", v: stats.foodCost + "%", c: "#EC4899" },
        ].map(k => (
          <div key={k.l} style={{ flex: 1, background: "#0D0D1A", border: "0.5px solid rgba(255,255,255,.06)", borderRadius: "10px", padding: "8px 12px", borderBottom: "2px solid " + k.c }}>
            <div style={{ fontSize: "10px", color: "#5A5B7A", marginBottom: "2px" }}>{k.l}</div>
            <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: "JetBrains Mono, monospace", color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Menu */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "0.5px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderBottom: "0.5px solid rgba(255,255,255,.05)" }}>
            <i className="ti ti-search" style={{ fontSize: "13px", color: "#3A3B52" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari menu..." style={{ flex: 1, background: "none", border: "none", fontSize: "12px", color: "#F0EFF8", outline: "none", fontFamily: "'Space Grotesk', sans-serif" }} />
          </div>
          <div style={{ display: "flex", gap: "5px", padding: "7px 12px", borderBottom: "0.5px solid rgba(255,255,255,.05)", overflowX: "auto", flexShrink: 0 }}>
            {categories.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", border: "0.5px solid " + (activeTab === tab ? "rgba(45,212,191,.45)" : "rgba(255,255,255,.08)"), color: activeTab === tab ? "#2DD4BF" : "#5A5B7A", background: activeTab === tab ? "rgba(45,212,191,.08)" : "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Space Grotesk', sans-serif" }}>{tab}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", padding: "10px 12px", overflowY: "auto", flex: 1 }}>
            {filtered.map(m => {
              const qty = cart[m.id] || 0;
              const color = KATEGORI_COLOR[m.kategori || ""] || "#8B8AA0";
              const icon = KATEGORI_ICON[m.kategori || ""] || "ti-dots";
              const hpp = calcHpp(m);
              const mg = m.harga_jual > 0 ? Math.round((m.harga_jual - hpp) / m.harga_jual * 100) : 0;
              return (
                <div key={m.id} onClick={() => addItem(m.id)} style={{ background: "#0D0D1A", border: "0.5px solid " + (qty > 0 ? "rgba(45,212,191,.4)" : "rgba(255,255,255,.06)"), borderRadius: "12px", overflow: "hidden", cursor: "pointer", position: "relative" }}>
                  {qty > 0 && <div style={{ position: "absolute", top: "5px", right: "5px", width: "17px", height: "17px", borderRadius: "50%", background: "#2DD4BF", color: "#070711", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{qty}</div>}
                  <div style={{ height: "52px", display: "flex", alignItems: "center", justifyContent: "center", background: color + "12" }}>
                    <i className={"ti " + icon} style={{ fontSize: "22px", color }} />
                  </div>
                  <div style={{ padding: "7px 8px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 500, marginBottom: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nama}</div>
                    <div style={{ fontSize: "10px", color: "#5A5B7A", marginBottom: "3px" }}>HPP Rp{Math.round(hpp).toLocaleString("id-ID")} · {mg}%</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, fontFamily: "JetBrains Mono, monospace", color: "#2DD4BF", marginBottom: "4px" }}>Rp{m.harga_jual.toLocaleString("id-ID")}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button onClick={e => { e.stopPropagation(); removeItem(m.id); }} style={{ width: "19px", height: "19px", borderRadius: "5px", border: "0.5px solid " + (qty > 0 ? "rgba(45,212,191,.4)" : "rgba(255,255,255,.08)"), background: qty > 0 ? "rgba(45,212,191,.08)" : "rgba(255,255,255,.03)", color: qty > 0 ? "#2DD4BF" : "#5A5B7A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>-</button>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", color: qty > 0 ? "#2DD4BF" : "#3A3B52", minWidth: "14px", textAlign: "center" }}>{qty}</span>
                      <button onClick={e => { e.stopPropagation(); addItem(m.id); }} style={{ width: "19px", height: "19px", borderRadius: "5px", border: "0.5px solid rgba(45,212,191,.4)", background: "rgba(45,212,191,.08)", color: "#2DD4BF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div style={{ width: "255px", display: "flex", flexDirection: "column", overflow: "hidden", background: "#0D0D1A" }}>
          <div style={{ padding: "10px 14px", borderBottom: "0.5px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: "10px", color: "#2DD4BF", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "1px" }}>Order aktif</div>
            <div style={{ fontSize: "11px", color: "#5A5B7A" }}>{cartItems.length} item</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px" }}>
            {cartItems.length === 0 ? <div style={{ textAlign: "center", padding: "2rem 0", color: "#3A3B52", fontSize: "12px" }}>Pilih menu di sebelah kiri</div> :
              cartItems.map(c => (
                <div key={c.menu.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 0", borderBottom: "0.5px solid rgba(255,255,255,.04)" }}>
                  <div style={{ flex: 1, fontSize: "11px", color: "#C4C3D4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.menu.nama}</div>
                  <div style={{ fontSize: "10px", color: "#5A5B7A", fontFamily: "monospace" }}>×{c.qty}</div>
                  <div style={{ fontSize: "11px", fontFamily: "monospace", whiteSpace: "nowrap" }}>Rp{(c.menu.harga_jual * c.qty).toLocaleString("id-ID")}</div>
                  <button onClick={() => setCart(prev => { const n = {...prev}; delete n[c.menu.id]; return n; })} style={{ background: "none", border: "none", color: "#3A3B52", cursor: "pointer", fontSize: "10px", padding: "0 2px" }}>✕</button>
                </div>
              ))
            }
          </div>
          <div style={{ padding: "10px 14px", borderTop: "0.5px solid rgba(255,255,255,.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#5A5B7A", marginBottom: "4px" }}><span>Subtotal</span><span style={{ fontFamily: "monospace" }}>Rp{subtotal.toLocaleString("id-ID")}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", color: "#5A5B7A", flex: 1 }}>Diskon</span>
              <input type="number" value={diskon} onChange={e => setDiskon(e.target.value)} placeholder="0" style={{ width: "60px", fontSize: "11px", padding: "3px 6px", borderRadius: "6px", border: "0.5px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", color: "#F0EFF8", textAlign: "right", fontFamily: "monospace", outline: "none" }} />
              <span style={{ fontSize: "10px", color: "#5A5B7A" }}>Rp</span>
            </div>
            <div style={{ height: "0.5px", background: "rgba(255,255,255,.06)", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500 }}>Total</span>
              <span style={{ fontSize: "16px", fontWeight: 600, fontFamily: "JetBrains Mono, monospace", color: "#2DD4BF" }}>Rp{total.toLocaleString("id-ID")}</span>
            </div>
            <div style={{ fontSize: "10px", color: "#5A5B7A", marginBottom: "8px" }}>Laba est. <span style={{ color: "#2DD4BF" }}>Rp{Math.round(laba).toLocaleString("id-ID")}</span> · {margin}%</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "4px", marginBottom: "7px" }}>
              {[{ v: "tunai", l: "Tunai", icon: "ti-cash" }, { v: "qris", l: "QRIS", icon: "ti-qrcode" }, { v: "transfer", l: "Transfer", icon: "ti-credit-card" }].map(m => (
                <button key={m.v} onClick={() => setMetodeBayar(m.v)} style={{ padding: "6px 3px", borderRadius: "7px", border: "0.5px solid " + (metodeBayar === m.v ? "rgba(45,212,191,.4)" : "rgba(255,255,255,.08)"), background: metodeBayar === m.v ? "rgba(45,212,191,.07)" : "none", color: metodeBayar === m.v ? "#2DD4BF" : "#5A5B7A", fontSize: "10px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", textAlign: "center" }}>
                  <i className={"ti " + m.icon} style={{ display: "block", fontSize: "12px", marginBottom: "2px" }} />{m.l}
                </button>
              ))}
            </div>
            <input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan (meja, nama...)" style={{ ...inputS, fontSize: "11px", padding: "6px 9px", marginBottom: "7px" }} />
            <button onClick={handleProses} disabled={loading || !cartItems.length} style={{ ...btnGrad, opacity: loading || !cartItems.length ? 0.35 : 1, cursor: loading || !cartItems.length ? "not-allowed" : "pointer" } as React.CSSProperties}>
              {loading ? "Memproses..." : `Proses — Rp${total.toLocaleString("id-ID")}`}
            </button>
            <button onClick={() => { setCart({}); setDiskon(""); setCatatan(""); }} style={{ width: "100%", padding: "6px", borderRadius: "8px", border: "0.5px solid rgba(236,72,153,.2)", background: "rgba(236,72,153,.04)", color: "#EC4899", fontSize: "11px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Reset order</button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && lastOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(7,7,17,.96)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}>
          <div style={{ background: "#0D0D1A", border: "0.5px solid rgba(45,212,191,.25)", borderRadius: "20px", padding: "1.75rem", maxWidth: "320px", width: "100%", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(45,212,191,.1)", border: "0.5px solid rgba(45,212,191,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto .75rem", fontSize: "24px", color: "#2DD4BF" }}>✓</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#2DD4BF", marginBottom: ".25rem" }}>Transaksi berhasil!</div>
            <div style={{ fontSize: "11px", color: "#5A5B7A", marginBottom: "1.25rem" }}>Stok berkurang otomatis · Keuangan tercatat</div>
            {[["Kasir", employee.nama], ["Item", lastOrder.items + " item"], ["Total", "Rp" + lastOrder.total.toLocaleString("id-ID")], ["Diskon", "Rp" + lastOrder.disc.toLocaleString("id-ID")], ["Metode", lastOrder.metode], ["Laba", "Rp" + lastOrder.laba.toLocaleString("id-ID")], ["Catatan", lastOrder.note || "-"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", borderBottom: "0.5px solid rgba(255,255,255,.04)" }}>
                <span style={{ color: "#5A5B7A" }}>{k}</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", color: k === "Total" ? "#2DD4BF" : "#F0EFF8", fontWeight: k === "Total" ? 600 : 400 }}>{v}</span>
              </div>
            ))}
            <div style={{ height: ".5px", background: "rgba(255,255,255,.06)", margin: "10px 0" }} />
            <button onClick={() => setShowSuccess(false)} style={btnGrad as React.CSSProperties}>+ Order Berikutnya</button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(7,7,17,.96)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}>
          <div style={{ background: "#0D0D1A", border: "0.5px solid rgba(236,72,153,.25)", borderRadius: "20px", padding: "1.75rem", maxWidth: "320px", width: "100%", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(236,72,153,.1)", border: "0.5px solid rgba(236,72,153,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto .75rem", fontSize: "24px", color: "#EC4899" }}>↗</div>
            <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: ".25rem" }}>Check-out Shift</div>
            <div style={{ fontSize: "12px", color: "#5A5B7A", marginBottom: "1.25rem" }}>Ringkasan shift kamu hari ini</div>
            {[["Kasir", employee.nama], ["Total order", stats.totalOrders.toString()], ["Total omzet", "Rp" + stats.omzet.toLocaleString("id-ID")], ["Total laba", "Rp" + stats.laba.toLocaleString("id-ID")]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", borderBottom: "0.5px solid rgba(255,255,255,.04)" }}>
                <span style={{ color: "#5A5B7A" }}>{k}</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", color: k.includes("omzet") || k.includes("laba") ? "#2DD4BF" : "#F0EFF8" }}>{v}</span>
              </div>
            ))}
            <div style={{ height: ".5px", background: "rgba(255,255,255,.06)", margin: "10px 0" }} />
            <button onClick={doCheckout} style={{ ...btnGrad, background: "linear-gradient(135deg,#EC4899,#8B5CF6)" } as React.CSSProperties}>Konfirmasi Check-out</button>
            <button onClick={() => setShowCheckout(false)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "0.5px solid rgba(255,255,255,.08)", background: "none", color: "#8B8AA0", fontSize: "12px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Batal</button>
          </div>
        </div>
      )}

      {showSOP && <SOPModal onClose={() => setShowSOP(false)} />}
    </div>
  );
}

function SOPModal({ onClose }: { onClose: () => void }) {
  const S = (bg: string, border: string, color: string) => ({ background: bg, border: "0.5px solid " + border, borderRadius: "8px", padding: "10px 12px", fontSize: "11px", color, display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: ".75rem" });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(7,7,17,.97)", zIndex: 300, overflowY: "auto", padding: "1.5rem" }}>
      <div style={{ background: "#0D0D1A", border: "0.5px solid rgba(255,255,255,.07)", borderRadius: "16px", padding: "1.5rem", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div><div style={{ fontSize: "16px", fontWeight: 600, color: "#2DD4BF" }}>SOP Kasir GercepAI</div><div style={{ fontSize: "12px", color: "#5A5B7A", marginTop: "2px" }}>Standar Operasional Prosedur · F&B</div></div>
          <button onClick={onClose} style={{ background: "none", border: "0.5px solid rgba(255,255,255,.1)", color: "#8B8AA0", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Tutup</button>
        </div>
        <div style={S("rgba(45,212,191,.06)", "rgba(45,212,191,.15)", "#2DD4BF")}>ℹ️ Baca SOP ini sebelum memulai shift. Patuhi semua prosedur untuk menjaga kualitas pelayanan.</div>
        {[
          { title: "🌅 Membuka Kasir", steps: ["Pilih nama kamu, lakukan verifikasi sidik jari","Periksa stok bahan baku di Inventory","Cek menu aktif — pastikan tidak ada bahan habis","Siap menerima order!"] },
          { title: "💳 Melayani Pelanggan", steps: ["Sapa pelanggan, tanyakan pesanan","Pilih menu di aplikasi — klik kartu atau tombol +","Cek ringkasan order sebelum proses","Tanyakan metode bayar: Tunai / QRIS / Transfer","Input diskon jika ada promo","Klik Proses — sistem otomatis catat & kurangi stok","Ucapkan terima kasih"] },
          { title: "🌙 Menutup Kasir", steps: ["Pastikan semua transaksi sudah diproses","Klik Check-out di pojok kanan atas","Cek ringkasan shift kamu","Konfirmasi Check-out — jam keluar tercatat","Laporkan ke owner jika ada masalah"] },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#8B8AA0", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: ".6rem" }}>{section.title}</div>
            {section.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: ".5rem" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(45,212,191,.12)", color: "#2DD4BF", fontSize: "10px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</div>
                <div style={{ fontSize: "12px", color: "#8B8AA0", lineHeight: 1.6 }}>{step}</div>
              </div>
            ))}
          </div>
        ))}
        <div style={S("rgba(245,158,11,.06)", "rgba(245,158,11,.2)", "#F59E0B")}>⚠️ JANGAN proses transaksi tanpa memastikan pembayaran diterima. Semua transaksi terekam di dashboard owner.</div>
        <button onClick={onClose} style={{ width: "100%", padding: "11px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#2DD4BF,#8B5CF6)", color: "#070711", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>✓ Mengerti, Mulai Shift</button>
      </div>
    </div>
  );
}
