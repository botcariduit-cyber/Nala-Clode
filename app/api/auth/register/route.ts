import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function findUserByEmail(admin: NonNullable<ReturnType<typeof createAdminClient>>, email: string) {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
}

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
    return NextResponse.json({
      code: "NO_SERVICE_ROLE",
      error: "Server belum punya SUPABASE_SERVICE_ROLE_KEY — daftar otomatis nonaktif.",
    }, { status: 503 });
  }

  const existing = await findUserByEmail(admin, email);

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    await admin.from("profiles").upsert({ id: existing.id, full_name: name }, { onConflict: "id" });
    return NextResponse.json({ ok: true, reactivated: true });
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
