import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const catatTransaksiTool = {
  name: "catat_transaksi",
  description: "Catat transaksi keuangan (pemasukan atau pengeluaran) ke database berdasarkan pesan dari user.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: { type: "string", enum: ["pemasukan", "pengeluaran"], description: "Jenis transaksi" },
      amount: { type: "number", description: "Jumlah uang dalam Rupiah, contoh: 50rb jadi 50000" },
      description: { type: "string", description: "Deskripsi singkat, contoh: jual baju" },
      category: { type: "string", description: "Kategori, contoh: penjualan, modal, operasional" },
    },
    required: ["type", "amount"],
  },
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: "Kamu adalah Gercep AI, asisten bisnis buat UMKM Indonesia. Gaya bicara kamu tegas, singkat, langsung ke inti, kayak partner bisnis yang gercep — bukan asisten yang lembek atau basa-basi panjang. JANGAN pakai markdown (bintang, tanda bold) karena tampilan chat nggak support itu. JANGAN pakai emoji berlebihan, maksimal 1 emoji kalau perlu. Kalau user cerita soal transaksi (jualan, beli, pengeluaran, pemasukan), gunakan tool catat_transaksi buat nyatet otomatis. Kalau user cuma nanya atau ngobrol biasa, jawab singkat dan jelas.",
    tools: [catatTransaksiTool],
    messages: [{ role: "user", content: message }],
  });

  let replyText = "";
  let recordedTransaction = null;

  for (const block of response.content) {
    if (block.type === "text") {
      replyText += block.text;
    }
    if (block.type === "tool_use" && block.name === "catat_transaksi") {
      const input = block.input as { type: string; amount: number; description?: string; category?: string };

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: input.type,
        amount: input.amount,
        description: input.description || "",
        category: input.category || "",
      });

      if (!error) {
        recordedTransaction = input;
        replyText = `Sip, tercatat! ${input.type === "pemasukan" ? "Pemasukan" : "Pengeluaran"} ${input.description || ""} sebesar Rp${input.amount.toLocaleString("id-ID")}.`;
      } else {
        replyText = "Waduh, ada error pas nyimpen ke database. Coba lagi ya.";
      }
    }
  }

  return NextResponse.json({ reply: replyText, transaction: recordedTransaction });
}
