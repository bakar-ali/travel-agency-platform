import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "change-me-in-production"
  );
}

export function getAdminPassword() {
  const raw = process.env.ADMIN_PASSWORD?.trim();
  if (!raw) return "admin123";
  // Dokploy/env UIs sometimes include literal quotes
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function createSessionToken(): string {
  const expires = Date.now() + MAX_AGE_MS;
  const payload = `admin:${expires}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): boolean {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;

    const [, expiresStr] = payload.split(":");
    const expires = Number(expiresStr);
    if (!expires || Date.now() > expires) return false;

    const expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export function verifyAdminPassword(password: string): boolean {
  return safeEqual(password.trim(), getAdminPassword());
}
