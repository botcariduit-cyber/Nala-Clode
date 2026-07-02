import type { AgriDashboardData, Product } from "./types";
import { isHarvestCategory, isSaprotanCategory, fmtRp } from "./constants";

export type AgriInsight = {
  id: string;
  type: "profit" | "harvest" | "fertilizer" | "pesticide" | "cost" | "recommend" | "alert";
  title: string;
  body: string;
  value?: string;
  positive?: boolean;
};

export function computeAgriInsights(data: AgriDashboardData): AgriInsight[] {
  const insights: AgriInsight[] = [];
  const harvestProducts = data.products.filter(p => isHarvestCategory(p.category));
  const saprotanProducts = data.products.filter(p => isSaprotanCategory(p.category));

  const totalPanenValue = harvestProducts.reduce((s, p) => s + (p.price || 0) * p.stock, 0);
  const totalPanenQty = harvestProducts.reduce((s, p) => s + p.stock, 0);
  const totalBiaya = data.costs.reduce((s, c) => s + Number(c.jumlah), 0);
  const totalSprayCost = data.spraying.reduce((s, r) => s + Number(r.biaya || 0), 0);
  const totalCostAll = totalBiaya + totalSprayCost + saprotanProducts.reduce((s, p) => s + (p.cost || 0) * p.stock, 0);
  const predictedProfit = totalPanenValue - totalCostAll;
  const margin = totalPanenValue > 0 ? Math.round((predictedProfit / totalPanenValue) * 100) : 0;

  insights.push({
    id: "profit",
    type: "profit",
    title: "Prediksi Profit",
    body: totalPanenValue > 0
      ? `Estimasi keuntungan bersih ${fmtRp(predictedProfit)} dengan margin ${margin}% dari nilai panen.`
      : "Belum ada data panen. Catat hasil panen untuk prediksi profit.",
    value: fmtRp(predictedProfit),
    positive: predictedProfit >= 0,
  });

  const avgHarvestPerField = data.fields.length > 0
    ? Math.round(totalPanenQty / data.fields.length)
    : totalPanenQty;
  insights.push({
    id: "harvest",
    type: "harvest",
    title: "Prediksi Panen",
    body: data.fields.length > 0
      ? `Rata-rata ${avgHarvestPerField} unit panen per lahan. ${data.fields.filter(f => f.status === "siap_panen").length} lahan siap panen.`
      : `Total stok panen saat ini ${totalPanenQty} unit senilai ${fmtRp(totalPanenValue)}.`,
    value: String(totalPanenQty),
  });

  const pupukStock = saprotanProducts.filter(p => (p.category || "").toLowerCase().includes("pupuk"));
  const pupukNeed = Math.max(0, data.fields.reduce((s, f) => s + f.luas_lahan, 0) * 50 - pupukStock.reduce((s, p) => s + p.stock, 0));
  insights.push({
    id: "fertilizer",
    type: "fertilizer",
    title: "Prediksi Kebutuhan Pupuk",
    body: pupukNeed > 0
      ? `Estimasi kekurangan pupuk ~${Math.round(pupukNeed)} kg untuk luas lahan aktif (50 kg/ha).`
      : "Stok pupuk mencukupi untuk siklus tanam saat ini.",
    value: `${Math.round(pupukNeed)} kg`,
  });

  const pestStock = saprotanProducts.filter(p =>
    ["pestisida", "herbisida", "fungisida", "insektisida"].some(t => (p.category || "").toLowerCase().includes(t))
  );
  const lowPest = pestStock.filter(p => p.stock <= p.min_stock);
  insights.push({
    id: "pesticide",
    type: "pesticide",
    title: "Prediksi Kebutuhan Pestisida",
    body: lowPest.length > 0
      ? `${lowPest.length} jenis pestisida perlu restok. Jadwalkan penyemprotan rutin tiap 14 hari.`
      : "Stok pestisida aman. Pertahankan jadwal penyemprotan preventif.",
    value: String(lowPest.length),
    positive: lowPest.length === 0,
  });

  const costByCat: Record<string, number> = {};
  data.costs.forEach(c => { costByCat[c.kategori] = (costByCat[c.kategori] || 0) + Number(c.jumlah); });
  const topCost = Object.entries(costByCat).sort((a, b) => b[1] - a[1])[0];
  insights.push({
    id: "cost",
    type: "cost",
    title: "Analisis Efisiensi Biaya",
    body: topCost
      ? `Biaya terbesar: ${topCost[0]} (${fmtRp(topCost[1])}). Total biaya produksi ${fmtRp(totalCostAll)}.`
      : "Belum ada catatan biaya. Mulai catat biaya produksi untuk analisis HPP.",
    value: fmtRp(totalCostAll),
  });

  const profitable = rankCommodities(harvestProducts)[0];
  if (profitable) {
    insights.push({
      id: "top-commodity",
      type: "recommend",
      title: "Komoditas Paling Menguntungkan",
      body: `${profitable.name} memberikan margin tertinggi (~${profitable.margin}%) dengan nilai ${fmtRp(profitable.value)}.`,
      value: profitable.name,
      positive: true,
    });
  }

  const nextPlant = recommendNextCrop(harvestProducts, data.fields);
  insights.push({
    id: "next-crop",
    type: "recommend",
    title: "Rekomendasi Tanam Berikutnya",
    body: nextPlant,
    positive: true,
  });

  const lowSaprotan = saprotanProducts.filter(p => p.stock <= p.min_stock);
  lowSaprotan.forEach(p => {
    insights.push({
      id: `alert-stock-${p.id}`,
      type: "alert",
      title: "Stok Menipis",
      body: `${p.name} tersisa ${p.stock} — segera restok.`,
      positive: false,
    });
  });

  const today = new Date();
  saprotanProducts.forEach(p => {
    const meta = data.saprotanMeta.find(m => m.product_id === p.id);
    if (!meta?.tanggal_kadaluarsa) return;
    const exp = new Date(meta.tanggal_kadaluarsa);
    const days = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
    if (days <= 30 && days >= 0) {
      insights.push({
        id: `alert-exp-${p.id}`,
        type: "alert",
        title: "Hampir Kadaluarsa",
        body: `${p.name} kadaluarsa dalam ${days} hari (${meta.tanggal_kadaluarsa}).`,
        positive: false,
      });
    }
  });

  return insights;
}

function rankCommodities(products: Product[]) {
  return products
    .map(p => {
      const value = (p.price || 0) * p.stock;
      const margin = p.cost && p.price ? Math.round(((p.price - p.cost) / p.cost) * 100) : 0;
      return { name: p.name, value, margin };
    })
    .filter(p => p.value > 0)
    .sort((a, b) => b.margin - a.margin || b.value - a.value);
}

function recommendNextCrop(products: Product[], fields: AgriDashboardData["fields"]) {
  const ranked = rankCommodities(products);
  if (ranked.length > 0) return `Pertimbangkan menanam ${ranked[0].name} kembali berdasarkan performa margin terbaik.`;
  const idleFields = fields.filter(f => f.status === "panen");
  if (idleFields.length > 0) return `${idleFields.length} lahan sudah panen — siap untuk rotasi tanaman palawija atau sayuran.`;
  return "Mulai dengan komoditas lokal berpermintaan tinggi: cabai, tomat, atau padi varietas unggul.";
}

export function computeHPP(data: AgriDashboardData) {
  const totalBiaya = data.costs.reduce((s, c) => s + Number(c.jumlah), 0);
  const sprayCost = data.spraying.reduce((s, r) => s + Number(r.biaya || 0), 0);
  const saprotanCost = data.products
    .filter(p => isSaprotanCategory(p.category))
    .reduce((s, p) => s + (p.cost || 0) * p.stock, 0);
  const totalCost = totalBiaya + sprayCost + saprotanCost;
  const harvestQty = data.products.filter(p => isHarvestCategory(p.category)).reduce((s, p) => s + p.stock, 0);
  const hpp = harvestQty > 0 ? totalCost / harvestQty : 0;
  const panenValue = data.products.filter(p => isHarvestCategory(p.category)).reduce((s, p) => s + (p.price || 0) * p.stock, 0);
  const margin = panenValue > 0 ? ((panenValue - totalCost) / panenValue) * 100 : 0;
  const roi = totalCost > 0 ? ((panenValue - totalCost) / totalCost) * 100 : 0;
  return { totalCost, hpp, margin, roi, panenValue };
}
