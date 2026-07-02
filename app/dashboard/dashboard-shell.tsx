"use client";
import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { Menu, X, Zap } from "lucide-react";

export default function DashboardShell({ children, userName }: {
  children: React.ReactNode;
  userName?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-slate-100">
        <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#111827] px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="text-sm font-bold text-white">
              GERCEP <span className="holo-text">AI</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
            <div
              className="fixed top-14 left-0 bottom-0 z-50 w-64 overflow-y-auto border-r border-white/[0.06] bg-[#111827]"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar expanded={true} setExpanded={() => {}} businesses={businesses} activeBusiness={activeBusiness} userName={userName} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="pt-14">{children}</main>
      </div>
    );
  }

  return (
    <>
      <Sidebar userName={userName} />
      <main className="ml-64 min-h-screen flex-1 overflow-y-auto bg-[#0b0e14]">
        {children}
      </main>
    </>
  );
}
