"use client";
import { useState } from "react";
import Sidebar from "./sidebar";

export default function DashboardShell({ children, businesses, activeBusiness }: { 
  children: React.ReactNode; 
  businesses: { id: string; name: string; type: string | null }[];
  activeBusiness: { id: string; name: string; type: string | null } | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Sidebar expanded={expanded} setExpanded={setExpanded} businesses={businesses} activeBusiness={activeBusiness} />
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: expanded ? 260 : 72, transition: "margin-left 0.22s cubic-bezier(0.4,0,0.2,1)" }}
      >
        {children}
      </main>
    </>
  );
}
