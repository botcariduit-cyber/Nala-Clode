"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Pencil, ImagePlus } from "lucide-react";

type Product = { id: string; name: string; sku: string | null; stock: number; min_stock: number; price: number | null; cost: number | null; category: string | null; photo_url: string | null };

export default function EditProductModal({ product }: { product: Product }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku || "");
  const [stock, setStock] = useState(String(product.stock));
  const [minStock, setMinStock] = useState(String(product.min_stock));
  const [price, setPrice] = useState(product.price ? String(product.price) : "");
  const [cost, setCost] = useState(product.cost ? String(product.cost) : "");
  const [category, setCategory] = useState(product.category || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(product.photo_url || "");
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let photoUrl = product.photo_url;
    if (photoFile) {
      const path = `${product.id}-${Date.now()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage.from("product-photos").upload(path, photoFile);
      if (!uploadError) {
        const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
        photoUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("products").update({
      name, sku, category,
      photo_url: photoUrl,
      stock: Number(stock),
      min_stock: Number(minStock),
      price: price ? Number(price) : null,
      cost: cost ? Number(cost) : null,
    }).eq("id", product.id);
    setLoading(false);
    if (error) {
      alert("Gagal simpan: " + error.message);
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[#8B8AA0] hover:text-[#38BDF8] transition-colors p-1">
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setOpen(false)}>
          <div className="bg-[#0F0F1A] border border-white/10 rounded-2xl p-6 w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Edit Produk</h2>
              <button onClick={() => setOpen(false)} className="text-[#8B8AA0]"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, maxWidth: 56, maxHeight: 56, overflow: "hidden" }} className="rounded-lg bg-[#0A0A12] border border-white/10 flex items-center justify-center flex-shrink-0">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <ImagePlus size={18} className="text-[#8B8AA0]" />
                  )}
                </div>
                <span className="text-xs text-[#8B8AA0]">Ganti foto produk</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} />
              </label>

              <div className="grid grid-cols-[1fr_110px] gap-3">
                <input type="text" required placeholder="Nama produk" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50" />
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="px-3 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#2DD4BF] font-mono text-xs focus:outline-none focus:border-[#2DD4BF]/50" />
              </div>
              <input type="text" placeholder="Kategori (misal: pakaian, elektronik)" value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Stok" value={stock} onChange={(e) => setStock(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50" />
                <input type="number" placeholder="Stok minimum" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Harga jual" value={price} onChange={(e) => setPrice(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50" />
                <input type="number" placeholder="Modal (HPP)" value={cost} onChange={(e) => setCost(e.target.value)} className="px-4 py-2.5 rounded-lg bg-[#0A0A12] border border-white/10 text-[#F2F1F8] focus:outline-none focus:border-[#2DD4BF]/50" />
              </div>
              <button type="submit" disabled={loading} className="py-2.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-50 mt-1">
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
