"use client";
import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { Menu, X } from "lucide-react";

type Business = { id: string; name: string; type: string | null };

export default function DashboardShell({ children, businesses, activeBusiness, userName }: {
  children: React.ReactNode;
  businesses: Business[];
  activeBusiness: Business | null;
  userName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#070711] text-[#F2F1F8]">
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#0D0D1A] border-b border-white/5 flex items-center justify-between px-4 z-50">
          <span className="font-semibold text-lg">Gercep<span className="holo-text">AI</span></span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-white/5">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
            <div className="fixed top-14 left-0 bottom-0 w-64 z-50 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
      <Sidebar expanded={expanded} setExpanded={setExpanded} businesses={businesses} activeBusiness={activeBusiness} userName={userName} />
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: expanded ? 220 : 64, transition: "margin-left 0.22s cubic-bezier(0.4,0,0.2,1)" }}
      >
        {children}
      </main>
    </>
  );
}
