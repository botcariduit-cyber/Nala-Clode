"use client";

export default function ProfitIndicator({ totalProfit, totalAssetValue }: { totalProfit: number; totalAssetValue: number }) {
  const percentage = totalAssetValue > 0 ? (totalProfit / totalAssetValue) * 100 : 0;
  const isPositive = percentage >= 0;
  const clamped = Math.min(Math.abs(percentage), 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color1 = isPositive ? "#2DD4BF" : "#EC4899";
  const color2 = isPositive ? "#38BDF8" : "#F59E0B";

  return (
    <div className="relative bg-[#0F0F1A] border border-white/10 rounded-2xl p-5 mb-6 overflow-hidden">
      <div className="absolute w-40 h-40 rounded-full -top-12 -right-12" style={{ background: color1, filter: "blur(60px)", opacity: 0.18 }} />
      <div className="absolute w-32 h-32 rounded-full -bottom-12 -left-12" style={{ background: color2, filter: "blur(60px)", opacity: 0.12 }} />
      <div className="relative flex items-center gap-6">
        <div style={{ width: 130, height: 130 }} className="relative flex-shrink-0">
          <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color1} />
                <stop offset="100%" stopColor={color2} />
              </linearGradient>
            </defs>
            <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle cx="65" cy="65" r={radius} fill="none" stroke="url(#gaugeGradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={"font-mono text-2xl font-bold " + (isPositive ? "text-[#2DD4BF]" : "text-[#EC4899]")}>{isPositive ? "+" : "-"}{clamped.toFixed(1)}%</p>
            <p className="text-[9px] text-[#8B8AA0] mt-0.5">{isPositive ? "PROFIT" : "RUGI"}</p>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs text-[#8B8AA0] mb-1">Profit Terealisasi vs Aset Stok</p>
          <p className={"font-mono text-lg font-semibold mb-1 " + (isPositive ? "text-[#2DD4BF]" : "text-[#EC4899]")}>Rp{Math.abs(totalProfit).toLocaleString("id-ID")}</p>
          <p className="text-[10px] text-[#8B8AA0] leading-relaxed">{isPositive ? "Sudah untung " : "Masih perlu balik modal, "}dari total aset stok Rp{totalAssetValue.toLocaleString("id-ID")}</p>
        </div>
      </div>
    </div>
  );
}
