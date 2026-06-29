import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const businessId = searchParams.get("business_id");

  if (code) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    if (user && businessId) {
      await supabase.from("business_members")
        .update({ member_user_id: user.id, status: "aktif" })
        .eq("business_id", businessId)
        .eq("member_email", user.email)
        .eq("status", "pending");
    }
  }

  return NextResponse.redirect(new URL("/dashboard/fnb/kasir", request.url));
}
