"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function DeleteTransactionButton({ id, table = "transactions" }: { id: string; table?: "transactions" | "products" }) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm("Yakin mau hapus ini?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      alert("Gagal hapus: " + error.message);
      return;
    }
    router.refresh();
  };

  return (
    <button onClick={handleDelete} className="text-[#8B8AA0] hover:text-[#EC4899] transition-colors p-1">
      <Trash2 size={14} />
    </button>
  );
}
