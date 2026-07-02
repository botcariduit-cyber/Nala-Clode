export type BusinessType = "retail" | "ternak" | "kuliner" | "homeindustry" | "jasa" | "wholesale" | "olshop" | "kesehatan" | "pertanian" | "bengkel";

export type BusinessConfig = {
  produkLabel: string;
  stokLabel: string;
  tambahLabel: string;
  satuanLabel: string;
  alasanKeluar: { value: string; label: string }[];
  kategoriDefault: string[];
  kpiLabel: {
    total: string;
    lowStock: string;
    nilai: string;
    rataHarga: string;
  };
};

export const businessConfig: Record<string, BusinessConfig> = {
  retail: {
    produkLabel: "Produk",
    stokLabel: "Stok",
    tambahLabel: "Tambah produk",
    satuanLabel: "pcs",
    alasanKeluar: [
      { value: "terjual", label: "Terjual" },
      { value: "retur", label: "Retur" },
      { value: "rusak", label: "Rusak/Hilang" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Elektronik", "Fashion", "Makanan", "Minuman", "Kosmetik", "Aksesoris", "Perabot", "Lainnya"],
    kpiLabel: { total: "Total produk", lowStock: "Stok mau habis", nilai: "Nilai inventory", rataHarga: "Rata-rata harga" },
  },
  ternak: {
    produkLabel: "Hewan/Pakan",
    stokLabel: "Jumlah",
    tambahLabel: "Tambah hewan/pakan",
    satuanLabel: "ekor/kg",
    alasanKeluar: [
      { value: "terjual", label: "Dijual" },
      { value: "mati", label: "Mati" },
      { value: "sakit", label: "Sakit/Karantina" },
      { value: "rusak", label: "Afkir" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Ayam Broiler", "Ayam Kampung", "Sapi", "Kambing", "Ikan", "Pakan", "Obat", "Vitamin", "Peralatan"],
    kpiLabel: { total: "Total item", lowStock: "Stok kritis", nilai: "Nilai aset ternak", rataHarga: "Rata-rata nilai" },
  },
  kuliner: {
    produkLabel: "Bahan Baku",
    stokLabel: "Stok",
    tambahLabel: "Tambah bahan baku",
    satuanLabel: "porsi/kg",
    alasanKeluar: [
      { value: "terjual", label: "Terpakai/Terjual" },
      { value: "rusak", label: "Expired/Basi" },
      { value: "retur", label: "Dikembalikan" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Sayuran", "Daging", "Bumbu", "Minuman", "Kemasan", "Tepung", "Minyak", "Susu/Dairy", "Buah"],
    kpiLabel: { total: "Total bahan", lowStock: "Bahan mau habis", nilai: "Nilai stok bahan", rataHarga: "Rata-rata harga bahan" },
  },
  homeindustry: {
    produkLabel: "Bahan/Produk",
    stokLabel: "Stok",
    tambahLabel: "Tambah bahan/produk",
    satuanLabel: "pcs/kg",
    alasanKeluar: [
      { value: "terjual", label: "Terjual" },
      { value: "terpakai", label: "Terpakai produksi" },
      { value: "rusak", label: "Cacat/Gagal produksi" },
      { value: "retur", label: "Retur" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Bahan Baku", "Bahan Pendukung", "Kemasan", "Produk Jadi", "Alat", "Tepung", "Gula", "Mentega", "Lainnya"],
    kpiLabel: { total: "Total item", lowStock: "Bahan mau habis", nilai: "Nilai stok", rataHarga: "Rata-rata harga" },
  },
  jasa: {
    produkLabel: "Aset/Peralatan",
    stokLabel: "Jumlah",
    tambahLabel: "Tambah aset",
    satuanLabel: "unit",
    alasanKeluar: [
      { value: "terjual", label: "Dijual" },
      { value: "rusak", label: "Rusak/Hilang" },
      { value: "dipinjam", label: "Dipinjam" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Elektronik", "Kamera", "Komputer", "Kendaraan", "Peralatan Kerja", "Furniture", "Lainnya"],
    kpiLabel: { total: "Total aset", lowStock: "Aset kritis", nilai: "Nilai total aset", rataHarga: "Rata-rata nilai aset" },
  },
  wholesale: {
    produkLabel: "Produk",
    stokLabel: "Stok",
    tambahLabel: "Tambah produk",
    satuanLabel: "karton/pcs",
    alasanKeluar: [
      { value: "terjual", label: "Terjual/Dikirim" },
      { value: "retur", label: "Retur dari pembeli" },
      { value: "rusak", label: "Rusak/Expired" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Sembako", "Minuman", "Snack", "Rokok", "Sabun/Deterjen", "Elektronik", "Fashion", "Lainnya"],
    kpiLabel: { total: "Total SKU", lowStock: "Stok mau habis", nilai: "Nilai inventory", rataHarga: "Rata-rata harga" },
  },
  olshop: {
    produkLabel: "Produk",
    stokLabel: "Stok",
    tambahLabel: "Tambah produk",
    satuanLabel: "pcs",
    alasanKeluar: [
      { value: "terjual", label: "Terjual" },
      { value: "retur", label: "Retur pembeli" },
      { value: "rusak", label: "Rusak/Hilang" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Fashion", "Aksesoris", "Kosmetik", "Elektronik", "Makanan", "Minuman", "Handmade", "Lainnya"],
    kpiLabel: { total: "Total produk", lowStock: "Stok mau habis", nilai: "Nilai inventory", rataHarga: "Rata-rata harga" },
  },
  kesehatan: {
    produkLabel: "Produk/Obat",
    stokLabel: "Stok",
    tambahLabel: "Tambah produk/obat",
    satuanLabel: "pcs/strip",
    alasanKeluar: [
      { value: "terjual", label: "Terjual/Diberikan" },
      { value: "rusak", label: "Expired" },
      { value: "retur", label: "Retur" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Obat Bebas", "Obat Resep", "Vitamin", "Suplemen", "Alat Kesehatan", "Kosmetik Medis", "Lainnya"],
    kpiLabel: { total: "Total item", lowStock: "Stok mau habis", nilai: "Nilai stok", rataHarga: "Rata-rata harga" },
  },
  pertanian: {
    produkLabel: "Hasil Panen/Saprotan",
    stokLabel: "Stok",
    tambahLabel: "Tambah hasil/saprotan",
    satuanLabel: "kg/ton/karung",
    alasanKeluar: [
      { value: "terjual", label: "Terjual" },
      { value: "rusak", label: "Busuk/Rusak" },
      { value: "terpakai", label: "Terpakai di lahan" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Padi", "Sayuran", "Buah", "Palawija", "Benih", "Pupuk", "Pestisida", "Herbisida", "Fungisida", "Insektisida", "Nutrisi", "Bibit"],
    kpiLabel: { total: "Total komoditas", lowStock: "Saprotan kritis", nilai: "Nilai panen", rataHarga: "Rata-rata harga" },
  },
  bengkel: {
    produkLabel: "Spare Part/Bahan",
    stokLabel: "Stok",
    tambahLabel: "Tambah spare part",
    satuanLabel: "pcs/liter",
    alasanKeluar: [
      { value: "terjual", label: "Terjual/Dipasang" },
      { value: "rusak", label: "Rusak/Cacat" },
      { value: "retur", label: "Retur supplier" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Oli", "Ban", "Aki", "Filter", "Busi", "Rem", "Lampu", "Body", "Aksesoris", "Lainnya"],
    kpiLabel: { total: "Total spare part", lowStock: "Stok mau habis", nilai: "Nilai inventory", rataHarga: "Rata-rata harga" },
  },
  default: {
    produkLabel: "Produk",
    stokLabel: "Stok",
    tambahLabel: "Tambah produk",
    satuanLabel: "pcs",
    alasanKeluar: [
      { value: "terjual", label: "Terjual" },
      { value: "retur", label: "Retur" },
      { value: "rusak", label: "Rusak/Hilang" },
      { value: "lainnya", label: "Lainnya" },
    ],
    kategoriDefault: ["Umum", "Lainnya"],
    kpiLabel: { total: "Total produk", lowStock: "Stok mau habis", nilai: "Nilai inventory", rataHarga: "Rata-rata harga" },
  },
};

export function getConfig(businessType?: string | null): BusinessConfig {
  return businessConfig[businessType || "default"] || businessConfig["default"];
}
