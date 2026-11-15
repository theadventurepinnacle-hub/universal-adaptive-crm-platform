import "server-only";

type GatewayMessage = { role: "system" | "user" | "assistant"; content: string };

export async function askAiGateway(messages: GatewayMessage[], maxTokens = 700): Promise<string> {
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!apiKey) throw new Error("AI Gateway authentication is unavailable in this deployment");
  const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(18000),
    body: JSON.stringify({
      model: process.env.AI_GATEWAY_MODEL || "google/gemini-3.1-flash-lite",
      messages,
      max_tokens: maxTokens,
      temperature: 0.25,
    }),
  });
  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(result.error?.message || `AI Gateway request failed (${response.status})`);
  const content = result.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const combined = content.map((part) => part.text || "").join("").trim();
    if (combined) return combined;
  }
  throw new Error("AI Gateway returned an empty response");
}
