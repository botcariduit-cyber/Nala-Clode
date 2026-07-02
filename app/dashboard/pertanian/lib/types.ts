export type Product = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  min_stock: number;
  price: number | null;
  cost: number | null;
  category: string | null;
  photo_url: string | null;
};

export type HarvestMeta = {
  id: string;
  product_id: string;
  luas_lahan: number | null;
  tanggal_tanam: string | null;
  tanggal_panen: string | null;
  lama_masa_tanam: number | null;
  satuan: string | null;
  harga_pasar: number | null;
  grade_kualitas: string | null;
  lokasi_penyimpanan: string | null;
  catatan: string | null;
};

export type SaprotanMeta = {
  id: string;
  product_id: string;
  merek: string | null;
  supplier: string | null;
  tanggal_pembelian: string | null;
  tanggal_kadaluarsa: string | null;
  satuan: string | null;
  lokasi_penyimpanan: string | null;
};

export type AgriField = {
  id: string;
  nama_lahan: string;
  luas_lahan: number;
  lokasi: string | null;
  jenis_tanaman: string | null;
  varietas: string | null;
  tanggal_tanam: string | null;
  status: string;
  catatan: string | null;
};

export type SprayingRecord = {
  id: string;
  tanggal: string;
  nama_produk: string;
  jenis_produk: string | null;
  dosis: string | null;
  luas_area: number | null;
  biaya: number | null;
  operator: string | null;
  catatan: string | null;
};

export type ProductionCost = {
  id: string;
  tanggal: string;
  kategori: string;
  deskripsi: string | null;
  jumlah: number;
};

export type AgriDashboardData = {
  products: Product[];
  harvestMeta: HarvestMeta[];
  saprotanMeta: SaprotanMeta[];
  fields: AgriField[];
  spraying: SprayingRecord[];
  costs: ProductionCost[];
  history: { snapshot_date: string; total_value: number }[];
};
