-- Gercep AI — Modul Pertanian (backward-compatible, additive only)
-- Jalankan di Supabase SQL Editor atau via supabase db push

-- Meta data hasil panen (terhubung ke products existing)
CREATE TABLE IF NOT EXISTS agri_harvest_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  luas_lahan DECIMAL(12, 2),
  tanggal_tanam DATE,
  tanggal_panen DATE,
  lama_masa_tanam INTEGER,
  satuan TEXT DEFAULT 'kg',
  harga_pasar DECIMAL(14, 2),
  grade_kualitas TEXT,
  lokasi_penyimpanan TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)
);

-- Meta data saprotan (terhubung ke products existing)
CREATE TABLE IF NOT EXISTS agri_saprotan_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  merek TEXT,
  supplier TEXT,
  tanggal_pembelian DATE,
  tanggal_kadaluarsa DATE,
  satuan TEXT DEFAULT 'kg',
  lokasi_penyimpanan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)
);

-- Manajemen lahan
CREATE TABLE IF NOT EXISTS agri_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  nama_lahan TEXT NOT NULL,
  luas_lahan DECIMAL(12, 2) NOT NULL DEFAULT 0,
  lokasi TEXT,
  jenis_tanaman TEXT,
  varietas TEXT,
  tanggal_tanam DATE,
  status TEXT NOT NULL DEFAULT 'persemaian',
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Riwayat penyemprotan
CREATE TABLE IF NOT EXISTS agri_spraying_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nama_produk TEXT NOT NULL,
  jenis_produk TEXT,
  dosis TEXT,
  luas_area DECIMAL(12, 2),
  biaya DECIMAL(14, 2) DEFAULT 0,
  operator TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Catatan biaya produksi
CREATE TABLE IF NOT EXISTS agri_production_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  kategori TEXT NOT NULL,
  deskripsi TEXT,
  jumlah DECIMAL(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agri_harvest_business ON agri_harvest_meta(business_id);
CREATE INDEX IF NOT EXISTS idx_agri_saprotan_business ON agri_saprotan_meta(business_id);
CREATE INDEX IF NOT EXISTS idx_agri_fields_business ON agri_fields(business_id);
CREATE INDEX IF NOT EXISTS idx_agri_spraying_business ON agri_spraying_records(business_id);
CREATE INDEX IF NOT EXISTS idx_agri_costs_business ON agri_production_costs(business_id);

-- RLS (enable + policy per user)
ALTER TABLE agri_harvest_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE agri_saprotan_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE agri_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE agri_spraying_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE agri_production_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agri_harvest_own" ON agri_harvest_meta FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agri_saprotan_own" ON agri_saprotan_meta FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agri_fields_own" ON agri_fields FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agri_spraying_own" ON agri_spraying_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agri_costs_own" ON agri_production_costs FOR ALL USING (auth.uid() = user_id);
