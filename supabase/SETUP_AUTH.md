# Setup Auth — Daftar Langsung Tanpa Email

Kalau user daftar dapat pesan "cek email" tapi **email tidak masuk**, lakukan ini:

## Opsi A (Recommended untuk jualan app)

1. Buka **Supabase** → Project kamu → **Settings** → **API**
2. Copy **`service_role`** key (secret, jangan dibagikan ke client)
3. Buka **Vercel** → Project `Nala-Clode` → **Settings** → **Environment Variables**
4. Tambahkan:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (paste service_role key)
   ```
5. **Redeploy** (Deployments → Redeploy)

Setelah itu daftar langsung masuk tanpa email konfirmasi. User yang sudah pernah daftar (terjebak unconfirmed) juga otomatis diaktifkan ulang kalau daftar lagi dengan email yang sama.

## Opsi B (tanpa service role)

1. Supabase → **Authentication** → **Providers** → **Email**
2. **Matikan** toggle **"Confirm email"**
3. Save

Daftar akan langsung dapat session tanpa kirim email.

## Local development

Tambahkan di `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Lalu restart `npm run dev`.

## Cek user macet (unconfirmed)

Supabase → **Authentication** → **Users** → cari email user → klik user → **Confirm user** manual.

Atau hapus user lalu daftar ulang setelah Opsi A sudah diset.
