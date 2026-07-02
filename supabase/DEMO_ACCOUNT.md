# Akun Demo Gercep AI

Buat akun demo di **Supabase Dashboard → Authentication → Users → Add user**:

| Field | Value |
|-------|-------|
| Email | `demo@gercep.id` |
| Password | `Gercep123!` |
| Auto Confirm | ✅ Yes |

Setelah user dibuat, jalankan SQL ini di **SQL Editor** (ganti `USER_ID` dengan UUID user demo):

```sql
-- Ganti USER_ID dengan id dari auth.users untuk demo@gercep.id
-- SELECT id FROM auth.users WHERE email = 'demo@gercep.id';

INSERT INTO profiles (id, full_name) VALUES ('USER_ID', 'Demo Gercep')
ON CONFLICT (id) DO UPDATE SET full_name = 'Demo Gercep';

-- Contoh 3 bisnis berbeda untuk demo multi-bisnis
INSERT INTO businesses (user_id, name, type) VALUES
  ('USER_ID', 'Warung Pak Budi', 'kuliner'),
  ('USER_ID', 'Kebun Sejahtera', 'pertanian'),
  ('USER_ID', 'Ternak Makmur', 'ternak');
```

Login di app: **Masuk Akun Demo** atau manual `demo@gercep.id` / `Gercep123!`

Override via Vercel env (opsional):
- `NEXT_PUBLIC_DEMO_EMAIL`
- `NEXT_PUBLIC_DEMO_PASSWORD`
