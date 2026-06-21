"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email atau password salah");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#0A0A12] text-[#F2F1F8] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <a href="/" className="font-semibold text-lg">Gercep<span className="holo-text">AI</span></a>
          <h1 className="text-2xl font-semibold mt-6 mb-2">Selamat datang lagi</h1>
          <p className="text-sm text-[#8B8AA0]">Masuk buat lanjut kelola bisnis kamu.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#8B8AA0] mb-1.5 block">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" placeholder="email@kamu.com" />
          </div>
          <div>
            <label className="text-xs text-[#8B8AA0] mb-1.5 block">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50" placeholder="Password kamu" />
          </div>

          {error && <p className="text-sm text-[#EC4899]">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-50 mt-2">
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-sm text-[#8B8AA0] mt-6">Belum punya akun? <a href="/signup" className="text-[#2DD4BF]">Daftar gratis</a></p>
      </div>
    </main>
  );
}
