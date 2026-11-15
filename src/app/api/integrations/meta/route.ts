import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { integrationCredentials } from "@/db/schema";
import { getAuthenticatedSession, isSameOrigin } from "@/lib/auth";
import { getAdventureOrganization } from "@/lib/meta-ingest";
import { encryptMetaSecret } from "@/lib/meta-crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await getAuthenticatedSession())) return Response.json({ error: "Authentication required" }, { status: 401 });
  const organization = await getAdventureOrganization();
  const [row] = await db.select({
    appId: integrationCredentials.appId,
    accessTokenCiphertext: integrationCredentials.accessTokenCiphertext,
  }).from(integrationCredentials).where(
    and(eq(integrationCredentials.organizationId, organization.id), eq(integrationCredentials.provider, "meta")),
  ).limit(1);
  return Response.json({
    callbackUrl: `${request.nextUrl.origin}/api/webhooks/meta`,
    verifyToken: process.env.META_VERIFY_TOKEN || "",
    credentialsSaved: Boolean(row),
    appId: row?.appId || "",
    leadAdsEnabled: Boolean(row?.accessTokenCiphertext),
    aiEnabled: Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN),
    aiModel: process.env.AI_GATEWAY_MODEL || "google/gemini-3.1-flash-lite",
  });
}

export async function POST(request: NextRequest) {
  if (!(await getAuthenticatedSession())) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json() as { appId?: unknown; appSecret?: unknown; accessToken?: unknown };
    const appId = typeof body.appId === "string" ? body.appId.trim() : "";
    const appSecret = typeof body.appSecret === "string" ? body.appSecret.trim() : "";
    const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
    if (appId && !/^\d{5,30}$/.test(appId)) return Response.json({ error: "Enter a valid Meta App ID." }, { status: 400 });
    if (!appSecret && !accessToken) return Response.json({ error: "Enter the Meta App Secret or Page Access Token to save." }, { status: 400 });
    const organization = await getAdventureOrganization();
    const [existing] = await db.select().from(integrationCredentials).where(
      and(eq(integrationCredentials.organizationId, organization.id), eq(integrationCredentials.provider, "meta")),
    ).limit(1);
    if (!existing && (!appId || !appSecret)) {
      return Response.json({ error: "The Meta App ID and App Secret are required for the first connection." }, { status: 400 });
    }
    const values = {
      organizationId: organization.id,
      provider: "meta",
      appId: appId || existing?.appId || null,
      appSecretCiphertext: appSecret ? encryptMetaSecret(appSecret) : existing!.appSecretCiphertext,
      accessTokenCiphertext: accessToken ? encryptMetaSecret(accessToken) : existing?.accessTokenCiphertext || null,
      updatedAt: new Date(),
    };
    await db.insert(integrationCredentials).values(values).onConflictDoUpdate({
      target: [integrationCredentials.organizationId, integrationCredentials.provider],
      set: {
        appId: values.appId,
        appSecretCiphertext: values.appSecretCiphertext,
        accessTokenCiphertext: values.accessTokenCiphertext,
        updatedAt: values.updatedAt,
      },
    });
    return Response.json({ success: true, credentialsSaved: true, leadAdsEnabled: Boolean(values.accessTokenCiphertext) });
  } catch (error) {
    console.error("Meta credentials could not be saved:", error);
    return Response.json({ error: "Meta credentials could not be saved. Please check the values and try again." }, { status: 500 });
  }
}
