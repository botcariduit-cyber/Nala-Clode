"use client";
import Link from "next/link";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, MessageCircle } from "lucide-react";
import type { AgriDashboardData } from "../lib/types";
import { computeAgriInsights } from "../lib/ai-insights";
import { cardCls } from "../lib/constants";

const ICON_MAP = {
  profit: TrendingUp,
  harvest: Sparkles,
  fertilizer: Lightbulb,
  pesticide: AlertTriangle,
  cost: TrendingUp,
  recommend: Lightbulb,
  alert: AlertTriangle,
};

export default function AiInsightModule({ data }: { data: AgriDashboardData }) {
  const insights = computeAgriInsights(data);
  const main = insights.filter(i => i.type !== "alert");
  const alerts = insights.filter(i => i.type === "alert");

  return (
    <div className="space-y-4">
      <div className={`${cardCls} p-5 border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-indigo-600/5`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-violet-400" />
            <h3 className="font-semibold">Insight Gercep Pertanian</h3>
          </div>
          <Link href="/dashboard/chat?context=pertanian"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:opacity-90">
            <MessageCircle size={14} /> ✨ Tanya Gercep Pertanian
          </Link>
        </div>
        <p className="text-xs text-[#8B8AA0] mb-4">
          Contoh: &quot;Berapa estimasi keuntungan panen saya?&quot; · &quot;Berapa kebutuhan pupuk bulan depan?&quot; · &quot;Kapan waktu panen terbaik?&quot;
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {main.map(ins => {
            const Icon = ICON_MAP[ins.type] || Sparkles;
            return (
              <div key={ins.id} className="rounded-xl bg-[#0A0A12]/80 border border-white/[0.06] p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Icon size={16} className={ins.positive === false ? "text-red-400" : "text-violet-400"} />
                  <p className="text-sm font-medium">{ins.title}</p>
                </div>
                {ins.value && <p className={`text-lg font-mono font-semibold mb-1 ${ins.positive === false ? "text-red-400" : "text-emerald-400"}`}>{ins.value}</p>}
                <p className="text-xs text-[#8B8AA0] leading-relaxed">{ins.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className={`${cardCls} p-4 border-amber-500/20`}>
          <p className="text-xs font-semibold text-amber-400 mb-2">Peringatan Aktif</p>
          <ul className="space-y-1">{alerts.map(a => <li key={a.id} className="text-xs text-[#8B8AA0]">⚠ {a.body}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
