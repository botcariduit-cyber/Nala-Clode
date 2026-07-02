# Akun Demo Gercep AI

Akun demo **otomatis dibuat** saat pembeli klik **Masuk Akun Demo** (`/login`) atau **Coba Akun Demo** (`/signup`).

| Field | Value |
|-------|-------|
| Email | `demo@gercep.id` |
| Password | `Gercep123!` |

## Data contoh yang terisi otomatis

- **Warung Pak Budi** (kuliner) — omzet & transaksi
- **Kebun Sejahtera** (pertanian) — panen, lahan, biaya
- **Ternak Makmur** (ternak) — batch ayam + transaksi farm

Dashboard Owner langsung menampilkan ranking untung/rugi multi-bisnis.

## Wajib: env di Vercel

Tambahkan di **Vercel → Settings → Environment Variables**:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ... (dari Supabase → Settings → API → service_role)
```

Tanpa key ini, tombol demo gagal dengan pesan error jelas.

Opsional override:
- `NEXT_PUBLIC_DEMO_EMAIL`
- `NEXT_PUBLIC_DEMO_PASSWORD`

## Reset demo

Hapus user `demo@gercep.id` di Supabase Auth, lalu klik tombol demo lagi — data akan di-seed ulang.
