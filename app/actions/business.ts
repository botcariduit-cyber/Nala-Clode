"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function switchBusiness(businessId: string) {
  const cookieStore = await cookies();
  cookieStore.set("active_business_id", businessId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect("/dashboard/inventory");
}

export async function deleteBusiness(businessId: string) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("products").delete().eq("business_id", businessId);
  await supabase.from("businesses").delete().eq("id", businessId).eq("user_id", user.id);
  const cookieStore = await cookies();
  const activeId = cookieStore.get("active_business_id")?.value;
  if (activeId === businessId) cookieStore.delete("active_business_id");
  redirect("/dashboard/inventory");
}

export async function addNewBusiness() {
  const cookieStore = await cookies();
  cookieStore.delete("active_business_id");
  redirect("/onboarding?mode=new");
}
