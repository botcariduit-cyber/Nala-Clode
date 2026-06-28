"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

type Product = { id: string; name: string; cost: number | null; stock: number; category: string | null };
type MenuRecipe = { id: string; quantity: number; unit: string; products: Product };
type Menu = { id: string; nama: string; kategori: string | null; harga_jual: number; yield_quantity: number; status: string; foto_url: string | null; menu_recipes: MenuRecipe[] };

const KATEGORI_MENU = ["Makanan", "Minuman", "Snack", "Paket", "Lainnya"];
const KATEGORI_COLOR: Record<string, string> = { "Makanan": "#1D9E75", "Minuman": "#185FA5", "Snack": "#BA7517", "Paket": "#534AB7", "Lainnya": "#888780" };
const KATEGORI_BG: Record<string, string> = { "Makanan": "#E1F5EE", "Minuman": "#E6F1FB", "Snack": "#FAEEDA", "Paket": "#EEEDFE", "Lainnya": "#F1EFE8" };
const inputCls = "w-full px-3 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50 text-sm";

function calcHpp(menu: Menu): number {
  const totalBahan = menu.menu_recipes.reduce((sum, r) => {
    return sum + (r.products.cost || 0) * r.quantity;
  }, 0);
  return totalBahan / (menu.yield_quantity || 1);
}

type FormMenuProps = {
  editMenu: Menu | null;
  fNama: string; setFNama: (v: string) => void;
  fKategori: string; setFKategori: (v: string) => void;
  fHarga: string; setFHarga: (v: string) => void;
  fStatus: string; setFStatus: (v: string) => void;
  fYield: string; setFYield: (v: string) => void;
  loading: boolean;
  onSave: () => void; onCancel: () => void;
};

function FormMenu({ editMenu, fNama, setFNama, fKategori, setFKategori, fHarga, setFHarga, fStatus, setFStatus, fYield, setFYield, loading, onSave, onCancel }: FormMenuProps) {
  return (
    <div className="bg-[#0A0A12] border border-[#2DD4BF]/20 rounded-xl p-4 mb-4">
      <p className="text-xs font-medium text-[#2DD4BF] mb-3">{editMenu ? "Edit Menu" : "Tambah Menu Baru"}</p>
      <div className="flex flex-col gap-2">
        <input className={inputCls} placeholder="Nama menu" value={fNama} onChange={e => setFNama(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className={inputCls} value={fKategori} onChange={e => setFKategori(e.target.value)}>
            <option value="">Pilih kategori</option>
            {KATEGORI_MENU.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <input className={inputCls} type="number" placeholder="Harga jual (Rp)" value={fHarga} onChange={e => setFHarga(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#8B8AA0] mb-1 block">1 batch resep menghasilkan</label>
            <input className={inputCls} type="number" placeholder="Contoh: 40" value={fYield} onChange={e => setFYield(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-[#8B8AA0] mb-1 block">Status</label>
            <select className={inputCls} value={fStatus} onChange={e => setFStatus(e.target.value)}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non-aktif</option>
            </select>
          </div>
        </div>
        {fYield && Number(fYield) > 1 && fHarga && (
          <div className="text-[11px] text-[#8B8AA0] px-1">
            HPP per porsi akan dihitung dari total bahan dibagi {fYield} porsi
          </div>
        )}
        <div className="flex gap-2 mt-1">
          <button onClick={onSave} disabled={loading} className="flex-1 py-2 rounded-lg text-[#0A0A12] font-semibold text-sm disabled:opacity-50" style={{ background: "linear-gradient(to right, #38BDF8, #8B5CF6)" }}>
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/10 text-sm text-[#8B8AA0]">Batal</button>
        </div>
      </div>
    </div>
  );
}

type FormResepProps = {
  menuId: string; products: Product[];
  fProductId: string; setFProductId: (v: string) => void;
  fQty: string; setFQty: (v: string) => void;
  fUnit: string; setFUnit: (v: string) => void;
  loading: boolean;
  onSave: () => void; onCancel: () => void;
};

function FormResep({ products, fProductId, setFProductId, fQty, setFQty, fUnit, setFUnit, loading, onSave, onCancel }: FormResepProps) {
  return (
    <div className="bg-[#0A0A12] border border-[#8B5CF6]/20 rounded-xl p-3 mt-2">
      <p className="text-xs font-medium text-[#8B5CF6] mb-2">Tambah Bahan</p>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <select className={inputCls + " col-span-3 sm:col-span-1"} value={fProductId} onChange={e => setFProductId(e.target.value)}>
          <option value="">Pilih bahan dari inventory</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>)}
        </select>
        <input className={inputCls} type="number" placeholder="Jumlah" value={fQty} onChange={e => setFQty(e.target.value)} />
        <input className={inputCls} placeholder="Satuan (gr/ml/pcs)" value={fUnit} onChange={e => setFUnit(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={loading} className="flex-1 py-1.5 rounded-lg text-[#0A0A12] font-semibold text-xs disabled:opacity-50" style={{ background: "linear-gradient(to right, #38BDF8, #8B5CF6)" }}>
          {loading ? "..." : "Tambah Bahan"}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-[#8B8AA0]">Batal</button>
      </div>
    </div>
  );
}

export default function FnbMenuClient({ menus, products, userId, businessId }: { menus: Menu[]; products: Product[]; userId: string; businessId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("Semua");
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editMenu, setEditMenu] = useState<Menu | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showResepForm, setShowResepForm] = useState<string | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [resepLoading, setResepLoading] = useState(false);

  const [fNama, setFNama] = useState("");
  const [fKategori, setFKategori] = useState("Makanan");
  const [fHarga, setFHarga] = useState("");
  const [fStatus, setFStatus] = useState("aktif");
  const [fYield, setFYield] = useState("1");

  const [fProductId, setFProductId] = useState("");
  const [fQty, setFQty] = useState("");
  const [fUnit, setFUnit] = useState("gr");

  const resetMenuForm = () => { setFNama(""); setFKategori("Makanan"); setFHarga(""); setFStatus("aktif"); setFYield("1"); setEditMenu(null); };
  const resetResepForm = () => { setFProductId(""); setFQty(""); setFUnit("gr"); };

  const filtered = activeTab === "Semua" ? menus : menus.filter(m => m.kategori === activeTab);

  const handleSaveMenu = async () => {
    if (!fNama || !fHarga) return;
    setMenuLoading(true);
    const payload = { user_id: userId, business_id: businessId, nama: fNama, kategori: fKategori, harga_jual: Number(fHarga), status: fStatus, yield_quantity: Number(fYield) || 1 };
    if (editMenu) { await supabase.from("menus").update(payload).eq("id", editMenu.id); }
    else { await supabase.from("menus").insert(payload); }
    setMenuLoading(false); resetMenuForm(); setShowMenuForm(false); router.refresh();
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm("Hapus menu ini beserta resepnya?")) return;
    await supabase.from("menu_recipes").delete().eq("menu_id", id);
    await supabase.from("menus").delete().eq("id", id);
    router.refresh();
  };

  const handleSaveResep = async (menuId: string) => {
    if (!fProductId || !fQty) return;
    setResepLoading(true);
    await supabase.from("menu_recipes").insert({ menu_id: menuId, product_id: fProductId, quantity: Number(fQty), unit: fUnit });
    setResepLoading(false); resetResepForm(); setShowResepForm(null); router.refresh();
  };

  const handleDeleteResep = async (id: string) => {
    await supabase.from("menu_recipes").delete().eq("id", id);
    router.refresh();
  };

  const startEdit = (m: Menu) => {
    setEditMenu(m); setFNama(m.nama); setFKategori(m.kategori || "Makanan");
    setFHarga(m.harga_jual.toString()); setFStatus(m.status); setFYield((m.yield_quantity || 1).toString()); setShowMenuForm(true);
  };

  const totalMenu = menus.length;
  const totalAktif = menus.filter(m => m.status === "aktif").length;
  const avgMargin = menus.length > 0 ? menus.reduce((sum, m) => {
    const hpp = calcHpp(m);
    return sum + (hpp > 0 ? ((m.harga_jual - hpp) / m.harga_jual * 100) : 0);
  }, 0) / menus.length : 0;
  const menuRugi = menus.filter(m => {
    const hpp = calcHpp(m);
    return hpp > 0 && hpp > m.harga_jual;
  }).length;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4"><p className="text-xs text-[#8B8AA0] mb-1">Total menu</p><p className="text-lg font-mono font-semibold text-[#38BDF8]">{totalMenu}</p></div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4"><p className="text-xs text-[#8B8AA0] mb-1">Menu aktif</p><p className="text-lg font-mono font-semibold text-[#2DD4BF]">{totalAktif}</p></div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4"><p className="text-xs text-[#8B8AA0] mb-1">Avg. margin</p><p className="text-lg font-mono font-semibold text-[#8B5CF6]">{Math.round(avgMargin)}%</p></div>
        <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-4"><p className="text-xs text-[#8B8AA0] mb-1">Menu rugi</p><p className="text-lg font-mono font-semibold text-[#EC4899]">{menuRugi}</p></div>
      </div>

      <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="font-medium text-sm">Daftar Menu</span>
          <button onClick={() => { resetMenuForm(); setShowMenuForm(!showMenuForm); }} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: "linear-gradient(to right, #38BDF8, #8B5CF6)", color: "#0A0A12" }}>
            <Plus size={13} /> Tambah Menu
          </button>
        </div>

        <div className="flex gap-2 px-4 py-2.5 border-b border-white/10 overflow-x-auto">
          {["Semua", ...KATEGORI_MENU].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={"text-[11px] px-3 py-1 rounded-full border whitespace-nowrap " + (activeTab === tab ? "bg-[#2DD4BF]/15 border-[#2DD4BF]/40 text-[#2DD4BF]" : "border-white/10 text-[#8B8AA0]")}>{tab}</button>
          ))}
        </div>

        {showMenuForm && (
          <div className="px-4 py-3 border-b border-white/10">
            <FormMenu editMenu={editMenu} fNama={fNama} setFNama={setFNama} fKategori={fKategori} setFKategori={setFKategori} fHarga={fHarga} setFHarga={setFHarga} fStatus={fStatus} setFStatus={setFStatus} fYield={fYield} setFYield={setFYield} loading={menuLoading} onSave={handleSaveMenu} onCancel={() => { resetMenuForm(); setShowMenuForm(false); }} />
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-xs text-[#5A5B6A] text-center py-8">Belum ada menu. Klik "+ Tambah Menu" untuk mulai.</p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map(m => {
              const hpp = calcHpp(m);
              const laba = m.harga_jual - hpp;
              const margin = hpp > 0 ? (laba / m.harga_jual * 100) : null;
              const isRugi = hpp > 0 && laba < 0;
              const isExpanded = expandedId === m.id;
              const kat = m.kategori || "Lainnya";
              const katColor = KATEGORI_COLOR[kat] || "#888780";
              const katBg = KATEGORI_BG[kat] || "#F1EFE8";
              const bahanHabis = m.menu_recipes.filter(r => r.products.stock <= 0);
              return (
                <div key={m.id}>
                  <div className="flex items-center px-4 py-3 gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-medium">{m.nama}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: katBg, color: katColor }}>{kat}</span>
                        <span className={"text-[10px] px-2 py-0.5 rounded-full " + (m.status === "aktif" ? "bg-[#2DD4BF]/15 text-[#2DD4BF]" : "bg-white/5 text-[#8B8AA0]")}>{m.status}</span>
                        {bahanHabis.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EC4899]/15 text-[#EC4899]"><AlertTriangle size={9} className="inline mr-1" />bahan habis</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#8B8AA0]">
                        <span>Jual Rp{m.harga_jual.toLocaleString("id-ID")}</span>
                        {hpp > 0 && <span>HPP Rp{Math.round(hpp).toLocaleString("id-ID")}</span>}
                        {margin !== null && (
                          <span className={"font-medium " + (isRugi ? "text-[#EC4899]" : "text-[#2DD4BF]")}>
                            {isRugi ? "RUGI" : "Laba"} Rp{Math.abs(Math.round(laba)).toLocaleString("id-ID")} ({Math.abs(Math.round(margin))}%)
                          </span>
                        )}
                        {hpp === 0 && <span className="text-[#F59E0B]">Belum ada resep</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); startEdit(m); }} className="text-[#8B8AA0] hover:text-[#38BDF8] p-1"><Edit2 size={14} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteMenu(m.id); }} className="text-[#8B8AA0] hover:text-[#EC4899] p-1"><Trash2 size={14} /></button>
                      {isExpanded ? <ChevronUp size={14} className="text-[#8B8AA0]" /> : <ChevronDown size={14} className="text-[#8B8AA0]" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/[0.04] bg-[#0A0A12]/40">
                      <div className="flex items-center justify-between py-2 mb-1">
                        <p className="text-[11px] font-medium text-[#8B5CF6] uppercase tracking-wide">Resep — {m.nama}</p>
                        <button onClick={() => setShowResepForm(showResepForm === m.id ? null : m.id)} className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6]">
                          <Plus size={10} /> Tambah Bahan
                        </button>
                      </div>

                      {showResepForm === m.id && (
                        <FormResep menuId={m.id} products={products} fProductId={fProductId} setFProductId={setFProductId} fQty={fQty} setFQty={setFQty} fUnit={fUnit} setFUnit={setFUnit} loading={resepLoading} onSave={() => handleSaveResep(m.id)} onCancel={() => { resetResepForm(); setShowResepForm(null); }} />
                      )}

                      {m.menu_recipes.length === 0 ? (
                        <p className="text-xs text-[#5A5B6A] py-3 text-center">Belum ada bahan. Tambah bahan untuk hitung HPP otomatis.</p>
                      ) : (
                        <div className="flex flex-col">
                          {m.menu_recipes.map(r => {
                            const biaya = (r.products.cost || 0) * r.quantity;
                            const isHabis = r.products.stock <= 0;
                            return (
                              <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                                <div className="flex items-center gap-2">
                                  <div className={"w-1.5 h-1.5 rounded-full flex-shrink-0 " + (isHabis ? "bg-[#EC4899]" : "bg-[#2DD4BF]")}></div>
                                  <div>
                                    <p className={"text-xs " + (isHabis ? "text-[#EC4899]" : "text-[#F2F1F8]")}>{r.products.name} {isHabis && "(habis)"}</p>
                                    <p className="text-[10px] text-[#8B8AA0]">{r.quantity} {r.unit} · stok {r.products.stock}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-[#EC4899]">Rp{Math.round(biaya).toLocaleString("id-ID")}</span>
                                  <button onClick={() => handleDeleteResep(r.id)} className="text-[#8B8AA0] hover:text-[#EC4899] p-0.5"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10">
                            <span className="text-xs text-[#8B8AA0]">Total biaya bahan</span>
                            <span className="text-sm font-mono text-[#EC4899]">Rp{Math.round(hpp * (m.yield_quantity || 1)).toLocaleString("id-ID")}</span>
                          </div>
                          {(m.yield_quantity || 1) > 1 && (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-[#8B8AA0]">Hasil per batch</span>
                              <span className="text-sm font-mono text-[#F59E0B]">{m.yield_quantity} porsi</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-[#8B8AA0]">HPP per porsi</span>
                            <span className="text-sm font-mono font-semibold text-[#EC4899]">Rp{Math.round(hpp).toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-[#8B8AA0]">Harga jual</span>
                            <span className="text-sm font-mono text-[#2DD4BF]">Rp{m.harga_jual.toLocaleString("id-ID")}</span>
                          </div>
                          <div className={"flex items-center justify-between pt-1 mt-1 border-t border-white/10 " + (isRugi ? "text-[#EC4899]" : "text-[#2DD4BF]")}>
                            <span className="text-xs font-semibold">{isRugi ? "RUGI per porsi" : "Laba per porsi"}</span>
                            <span className="text-sm font-mono font-semibold">
                              {isRugi ? "-" : "+"}Rp{Math.abs(Math.round(laba)).toLocaleString("id-ID")}
                              {margin !== null && " (" + Math.abs(Math.round(margin)) + "%)"}
                            </span>
                          </div>
                          {isRugi && (
                            <div className="mt-2 flex items-center gap-2 bg-[#EC4899]/10 border border-[#EC4899]/20 rounded-lg px-3 py-2">
                              <AlertTriangle size={13} className="text-[#EC4899] flex-shrink-0" />
                              <p className="text-[11px] text-[#EC4899]">Menu ini dijual rugi! Naikkan harga jual atau kurangi bahan.</p>
                            </div>
                          )}
                          {bahanHabis.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg px-3 py-2">
                              <AlertTriangle size={13} className="text-[#F59E0B] flex-shrink-0" />
                              <p className="text-[11px] text-[#F59E0B]">Bahan habis: {bahanHabis.map(b => b.products.name).join(", ")}. Segera restock.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
