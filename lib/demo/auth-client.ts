import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./config";

export async function signInDemoAccount(supabase: SupabaseClient) {
  let { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (!error) return { ok: true as const };

  const res = await fetch("/api/demo/provision", { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, error: body.error || "Gagal menyiapkan akun demo." };
  }

  ({ error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  }));

  if (error) {
    return { ok: false as const, error: "Akun demo sudah dibuat tapi gagal masuk. Coba lagi." };
  }

  return { ok: true as const };
}
