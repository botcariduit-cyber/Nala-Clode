"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { Download, Upload } from "lucide-react";

type Product = { name: string; sku: string | null; category: string | null; stock: number; min_stock: number; price: number | null; cost: number | null };

export default function ImportExportButtons({ products, userId, businessId }: { products: Product[]; userId: string; businessId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const rows = products.map((p) => ({
      Nama: p.name,
      SKU: p.sku || "",
      Kategori: p.category || "",
      Stok: p.stock,
      "Stok Minimum": p.min_stock,
      "Harga Jual": p.price || 0,
      Modal: p.cost || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `inventory-gercep-ai-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const inserts = rows.map((r) => ({
      user_id: userId,
      business_id: businessId,
      name: String(r["Nama"] || r["nama"] || r["name"] || "").trim(),
      sku: String(r["SKU"] || r["sku"] || "").trim() || null,
      category: String(r["Kategori"] || r["kategori"] || "").trim() || null,
      stock: Number(r["Stok"] || r["stok"] || 0),
      min_stock: Number(r["Stok Minimum"] || r["min_stock"] || 5),
      price: Number(r["Harga Jual"] || r["harga"] || 0) || null,
      cost: Number(r["Modal"] || r["modal"] || 0) || null,
    })).filter((r) => r.name);

    if (inserts.length > 0) {
      await supabase.from("products").insert(inserts);
    }

    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleExport} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-[#8B8AA0] flex items-center gap-1.5">
        <Download size={13} /> Export
      </button>
      <button onClick={handleImportClick} disabled={importing} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-[#8B8AA0] flex items-center gap-1.5 disabled:opacity-50">
        <Upload size={13} /> {importing ? "Mengimpor..." : "Import"}
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
