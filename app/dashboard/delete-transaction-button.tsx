"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm("Yakin mau hapus transaksi ini?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    router.refresh();
  };

  return (
    <button onClick={handleDelete} className="text-[#8B8AA0] hover:text-[#EC4899] transition-colors p-1">
      <Trash2 size={14} />
    </button>
  );
}
