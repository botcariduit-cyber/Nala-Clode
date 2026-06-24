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

export async function addNewBusiness() {
  const cookieStore = await cookies();
  cookieStore.delete("active_business_id");
  redirect("/dashboard/onboarding");
}
