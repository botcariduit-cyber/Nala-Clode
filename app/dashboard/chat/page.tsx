"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo! Aku Gercep AI. Cerita aja transaksi bisnis kamu, misal: \"jual baju modal 30rb harga 50rb\" — nanti otomatis aku catat." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Maaf, ada error." }]);
      if (data.transaction) {
        router.refresh();
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Waduh, gagal konek ke server. Coba lagi ya." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A12] text-[#F2F1F8] flex flex-col">
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-sm text-[#8B8AA0]">&larr; Dashboard</a>
        <span className="font-semibold">Gercep<span className="holo-text">AI</span> Chat</span>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-[768px] w-full mx-auto">
        <div className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={m.role === "user"
                ? "bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%] text-sm font-medium"
                : "bg-[#0F0F1A] border border-white/10 px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[80%] text-sm font-medium"}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#0F0F1A] border border-white/10 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm text-[#8B8AA0]">
                Gercep AI lagi mikir...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="border-t border-white/5 px-6 py-4">
        <div className="max-w-[768px] mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik transaksi atau tanya apa aja..."
            className="flex-1 px-4 py-3 rounded-xl bg-[#0F0F1A] border border-white/10 text-[#F2F1F8] placeholder:text-[#8B8AA0] focus:outline-none focus:border-[#2DD4BF]/50"
          />
          <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#8B5CF6] text-[#0A0A12] font-semibold disabled:opacity-50">
            Kirim
          </button>
        </div>
      </form>
    </main>
  );
}
