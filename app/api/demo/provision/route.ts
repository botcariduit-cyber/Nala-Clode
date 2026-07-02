import { NextResponse } from "next/server";
import { provisionDemoAccount } from "@/lib/demo/provision";

export async function POST() {
  const result = await provisionDemoAccount();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, email: result.email });
}
