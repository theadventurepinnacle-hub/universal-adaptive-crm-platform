import { NextRequest } from "next/server";
import { createAuthSession, isSameOrigin, verifyCredentials } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json() as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) return Response.json({ error: "Enter your username and password." }, { status: 400 });
    if (!verifyCredentials(username, password)) return Response.json({ error: "Incorrect username or password." }, { status: 401 });
    await createAuthSession(username.trim().toLowerCase());
    return Response.json({ success: true });
  } catch (error) {
    console.error("CRM login failed:", error);
    return Response.json({ error: "Sign in is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
