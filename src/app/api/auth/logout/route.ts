import { NextRequest } from "next/server";
import { clearAuthSession, isSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  await clearAuthSession();
  return Response.json({ success: true });
}
