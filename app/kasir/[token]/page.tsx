import { createClient } from "@/lib/supabase/server";
import KasirPublicClient from "./kasir-public-client";

export default async function KasirPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("*, businesses(id, name, type)")
    .eq("kasir_token", token)
    .eq("aktif", true)
    .single();

  if (!employee) {
    return (
      <div style={{ background: "#070711", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#F0EFF8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "1rem" }}>⚠️</div>
          <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: ".5rem" }}>Link tidak valid</div>
          <div style={{ fontSize: "13px", color: "#5A5B7A" }}>Hubungi owner untuk mendapatkan link kasir yang benar.</div>
        </div>
      </div>
    );
  }

  const business = employee.businesses as { id: string; name: string; type: string };

  const { data: menus } = await supabase
    .from("menus")
    .select("*, menu_recipes(*, products(id, name, cost, stock))")
    .eq("business_id", business.id)
    .eq("status", "aktif")
    .order("kategori");

  const today = new Date().toISOString().split("T")[0];
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("total, hpp, laba")
    .eq("business_id", business.id)
    .eq("order_date", today);

  const omzet = todayOrders?.reduce((s, o) => s + Number(o.total || 0), 0) || 0;
  const laba = todayOrders?.reduce((s, o) => s + Number(o.laba || 0), 0) || 0;
  const totalOrders = todayOrders?.length || 0;
  const totalHpp = todayOrders?.reduce((s, o) => s + Number(o.hpp || 0), 0) || 0;
  const foodCost = omzet > 0 ? Math.round(totalHpp / omzet * 100) : 0;

  return (
    <KasirPublicClient
      employee={{ id: employee.id, nama: employee.nama, jabatan: employee.jabatan, kasir_token: token, webauthn_credential_id: employee.webauthn_credential_id }}
      business={business}
      menus={menus || []}
      initialStats={{ omzet, laba, totalOrders, foodCost }}
      today={today}
    />
  );
}
