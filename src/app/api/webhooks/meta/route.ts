import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { getAdventureOrganization, getMetaCredentials, handleMetaWebhookPayload } from "@/lib/meta-ingest";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  const expected = process.env.META_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return Response.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  try {
    const organization = await getAdventureOrganization();
    const credentials = await getMetaCredentials(organization.id);
    if (!credentials?.appSecret) {
      return Response.json({ error: "Meta app credentials have not been saved in CRM Settings" }, { status: 503 });
    }
    const expected = `sha256=${createHmac("sha256", credentials.appSecret).update(rawBody).digest("hex")}`;
    const expectedBuffer = Buffer.from(expected, "utf8");
    const suppliedBuffer = Buffer.from(signature, "utf8");
    if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      return Response.json({ error: "Invalid Meta webhook signature" }, { status: 401 });
    }
    const payload = JSON.parse(rawBody) as Record<string, any>;
    await handleMetaWebhookPayload(payload, credentials.accessToken);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Meta webhook processing failed:", error);
    return Response.json({ error: "Meta event could not be processed" }, { status: 500 });
  }
}
