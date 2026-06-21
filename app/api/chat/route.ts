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
      scope: { type: "string", enum: ["pribadi", "bisnis"], description: "Apakah ini transaksi pribadi (gaji, belanja sendiri, tagihan rumah) atau bisnis (jualan, modal usaha, operasional toko). Default ke bisnis kalau nggak jelas dan user lagi ngomongin jualan/usaha." },
      amount: { type: "number", description: "Jumlah uang dalam Rupiah, contoh: 50rb jadi 50000" },
      description: { type: "string", description: "Deskripsi singkat, contoh: jual baju" },
      category: { type: "string", description: "Kategori, contoh: penjualan, modal, operasional" },
    },
    required: ["type", "scope", "amount"],
  },
};

const kelolaStokTool = {
  name: "kelola_stok",
  description: "Tambah produk baru, update stok (nambah/kurang), atau set stok ke angka pasti. Kalau produk belum ada, otomatis dibuat baru.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Nama produk, contoh: sepatu, baju" },
      stock_change: { type: "number", description: "Perubahan stok relatif, positif nambah negatif ngurangin. Pakai ini kalau user bilang nambah/kurang sekian." },
      set_to: { type: "number", description: "Set stok ke angka pasti ini. Pakai ini kalau user bilang stoknya jadi sekian, atau koreksi stok jadi sekian, bukan nambah/kurang." },
      price: { type: "number", description: "Harga jual per item (opsional)" },
      cost: { type: "number", description: "Harga modal per item (opsional)" },
    },
    required: ["name"],
  },
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages: chatHistory } = await req.json();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  const businessId = business?.id;

  const { data: products } = await supabase
    .from("products")
    .select("name, stock, min_stock, price")
    .eq("user_id", user.id);

  const productContext = products && products.length > 0
    ? `Daftar stok produk user saat ini: ${JSON.stringify(products)}`
    : "User belum punya produk apapun di sistem.";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `Kamu adalah Gercep AI, asisten bisnis buat UMKM Indonesia. Gaya bicara kamu tegas, singkat, langsung ke inti, kayak partner bisnis yang gercep, bukan asisten yang lembek atau basa-basi panjang. JANGAN pakai markdown (bintang, tanda bold) karena tampilan chat nggak support itu. JANGAN pakai emoji berlebihan, maksimal 1 emoji kalau perlu.

Kalau user cerita soal transaksi (jualan, beli, pengeluaran, pemasukan), gunakan tool catat_transaksi.

Aturan nentuin scope (pribadi vs bisnis):
- PRIBADI: gaji, belanja pribadi, tagihan rumah, listrik rumah, makan sehari-hari, kebutuhan keluarga, cicilan pribadi
- BISNIS: jualan produk, beli stok/bahan baku, modal usaha, operasional toko, gaji karyawan, sewa tempat usaha
- Kalau ada kata "rumah", "pribadi", "sendiri", "keluarga" itu PRIBADI
- Kalau ada kata "jual", "modal", "toko", "usaha", "stok" itu BISNIS
- Kalau beneran ambigu dan nggak ada petunjuk jelas, TANYA dulu ke user, jangan asal nebak.

Kalau user nyebut nambah/kurang stok atau produk baru, gunakan tool kelola_stok.
Kalau user nanya soal stok yang ada, jawab langsung pakai data berikut, jangan pakai tool: ${productContext}
Kalau user cuma nanya atau ngobrol biasa, jawab singkat dan jelas.`,
    tools: [catatTransaksiTool, kelolaStokTool],
    messages: chatHistory,
  });

  let replyText = "";
  let recordedTransaction = null;

  for (const block of response.content) {
    if (block.type === "text") {
      replyText += block.text;
    }

    if (block.type === "tool_use" && block.name === "catat_transaksi") {
      const input = block.input as { type: string; scope: string; amount: number; description?: string; category?: string };
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        business_id: businessId,
        type: input.type,
        scope: input.scope,
        amount: input.amount,
        description: input.description || "",
        category: input.category || "",
      });
      if (!error) {
        recordedTransaction = input;
        replyText = `Sip, tercatat di keuangan ${input.scope}! ${input.type === "pemasukan" ? "Pemasukan" : "Pengeluaran"} ${input.description || ""} sebesar Rp${input.amount.toLocaleString("id-ID")}.`;
      } else {
        replyText = "Ada error pas nyimpen transaksi. Coba lagi.";
      }
    }

    if (block.type === "tool_use" && block.name === "kelola_stok") {
      const input = block.input as { name: string; stock_change?: number; set_to?: number; price?: number; cost?: number };

      const { data: existing } = await supabase
        .from("products")
        .select("id, stock")
        .eq("user_id", user.id)
        .ilike("name", input.name)
        .maybeSingle();

      if (existing) {
        const newStock = input.set_to !== undefined ? input.set_to : existing.stock + (input.stock_change || 0);
        const { error } = await supabase
          .from("products")
          .update({ stock: newStock, ...(input.price && { price: input.price }), ...(input.cost && { cost: input.cost }) })
          .eq("id", existing.id);
        replyText = error ? "Ada error pas update stok." : `Stok ${input.name} sekarang ${newStock} pcs.`;
      } else {
        const initialStock = input.set_to !== undefined ? input.set_to : Math.max(input.stock_change || 0, 0);
        const { error } = await supabase.from("products").insert({
          user_id: user.id,
          business_id: businessId,
          name: input.name,
          stock: initialStock,
          price: input.price,
          cost: input.cost,
        });
        replyText = error ? "Ada error pas nambah produk." : `Produk ${input.name} ditambahin, stok awal ${initialStock} pcs.`;
      }
      recordedTransaction = { stockUpdate: true };
    }
  }

  return NextResponse.json({ reply: replyText, transaction: recordedTransaction });
}
