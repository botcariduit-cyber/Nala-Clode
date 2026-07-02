import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name || !email || password.length < 6) {
    return NextResponse.json({ error: "Nama, email, dan password (min 6 karakter) wajib diisi." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ fallback: true });
  }

  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const exists = listed?.users?.some(u => u.email?.toLowerCase() === email);
  if (exists) {
    return NextResponse.json({ error: "Email sudah terdaftar. Coba masuk." }, { status: 409 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || "Gagal buat akun." }, { status: 400 });
  }

  await admin.from("profiles").upsert({ id: data.user.id, full_name: name }, { onConflict: "id" });

  return NextResponse.json({ ok: true });
}
