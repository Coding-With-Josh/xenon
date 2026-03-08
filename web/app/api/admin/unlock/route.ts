import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminCookie, ADMIN_PASSKEY, COOKIE_NAME, MAX_AGE } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const passkey = body?.passkey?.trim();
    if (passkey !== ADMIN_PASSKEY) {
      return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
    }
    const value = createAdminCookie();
    const c = await cookies();
    c.set(COOKIE_NAME, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
