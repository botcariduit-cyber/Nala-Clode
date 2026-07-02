import type { SupabaseClient } from "@supabase/supabase-js";

export async function registerAccount(
  supabase: SupabaseClient,
  opts: { name: string; email: string; password: string },
) {
  const name = opts.name.trim();
  const email = opts.email.trim().toLowerCase();
  const password = opts.password;

  const apiRes = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const apiBody = await apiRes.json().catch(() => ({}));

  if (apiRes.ok && apiBody.ok) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false as const, error: "Akun dibuat tapi gagal masuk. Coba login manual." };
    return { ok: true as const, needsEmailConfirm: false };
  }

  if (apiRes.status === 409) {
    return { ok: false as const, error: apiBody.error || "Email sudah terdaftar." };
  }

  if (!apiBody.fallback && apiBody.error) {
    return { ok: false as const, error: apiBody.error };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) return { ok: false as const, error: error.message };

  if (data.user) {
    await supabase.from("profiles").upsert({ id: data.user.id, full_name: name }, { onConflict: "id" });
  }

  if (data.session) {
    return { ok: true as const, needsEmailConfirm: false };
  }

  return {
    ok: true as const,
    needsEmailConfirm: true,
    message: "Akun dibuat! Cek email kamu untuk konfirmasi, lalu masuk.",
  };
}
