import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedSession, isSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await getAuthenticatedSession())) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  try {
    const body = await request.json() as { slug?: unknown };
    if (body.slug !== "adventure" && body.slug !== "homigo") {
      return Response.json({ error: "Invalid workspace" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("tap_crm_workspace", body.slug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return Response.json({ success: true, slug: body.slug });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
