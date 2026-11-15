import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "tap_crm_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
type SessionPayload = { username: string; expiresAt: number };

function safeEqualText(left: string, right: string): boolean {
  const a = createHash("sha256").update(left, "utf8").digest();
  const b = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(a, b);
}

function sessionSecret(): string {
  const secret = process.env.CRM_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("CRM_SESSION_SECRET is not configured");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

export function verifyCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.CRM_ADMIN_USERNAME;
  const expectedHash = process.env.CRM_ADMIN_PASSWORD_SHA256;
  if (!expectedUsername || !expectedHash) throw new Error("CRM owner login is not configured");
  const suppliedHash = createHash("sha256").update(password, "utf8").digest("hex");
  return safeEqualText(username.trim().toLowerCase(), expectedUsername.trim().toLowerCase())
    && safeEqualText(suppliedHash, expectedHash.trim().toLowerCase());
}

export async function createAuthSession(username: string): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt } satisfies SessionPayload)).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    expires: new Date(expiresAt * 1000),
  });
}

export async function clearAuthSession(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getAuthenticatedSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const expected = Buffer.from(sign(payload), "base64url");
    const supplied = Buffer.from(signature, "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof parsed.username !== "string" || typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    if (parsed.username !== process.env.CRM_ADMIN_USERNAME?.trim().toLowerCase()) return null;
    return { username: parsed.username, expiresAt: parsed.expiresAt };
  } catch { return null; }
}
