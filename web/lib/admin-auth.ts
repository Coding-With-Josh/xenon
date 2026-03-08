import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "xenon_admin";
const MAX_AGE = 24 * 60 * 60; // 24 hours

export const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY ?? "5512";

function getSecret() {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.ADMIN_PASSKEY ?? "xenon-admin-secret";
  return s;
}

export function createAdminCookie(): string {
  const t = Date.now().toString();
  const sig = createHmac("sha256", getSecret()).update("admin-" + t).digest("hex");
  const payload = JSON.stringify({ t, sig });
  return Buffer.from(payload).toString("base64url");
}

export function verifyAdminCookie(value: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString());
    const { t, sig } = payload;
    if (!t || !sig || typeof t !== "string") return false;
    const age = Date.now() - parseInt(t, 10);
    if (age < 0 || age > MAX_AGE * 1000) return false;
    const expected = createHmac("sha256", getSecret()).update("admin-" + t).digest("hex");
    if (expected.length !== sig.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export async function getAdminCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value ?? null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const value = await getAdminCookie();
  return value ? verifyAdminCookie(value) : false;
}

export { COOKIE_NAME, MAX_AGE };
