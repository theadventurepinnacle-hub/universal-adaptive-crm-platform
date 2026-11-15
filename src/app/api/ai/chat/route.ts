import { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { askAiGateway } from "@/lib/ai-gateway";
import { getWorkspaceData } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await getAuthenticatedSession())) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json() as { question?: unknown };
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 1200) : "";
    if (!question) return Response.json({ error: "Enter a question for your assistant." }, { status: 400 });
    const data = await getWorkspaceData("adventure");
    const context = {
      business: data.organization.name,
      today: new Date().toISOString().slice(0, 10),
      totals: {
        enquiries: data.leads.length,
        travellers: data.customers.length,
        tripBookings: data.deals.length,
        pipelineValueINR: data.deals.reduce((sum, deal) => sum + deal.value, 0),
        paymentsPendingINR: data.payments.reduce((sum, payment) => sum + Math.max(0, payment.totalAmount - payment.paidAmount), 0),
        openTasks: data.tasks.filter((task) => task.status !== "completed").length,
      },
      enquiries: data.leads.slice(0, 30).map((lead) => ({
        name: lead.name, source: lead.source, priority: lead.priority, score: lead.score,
        stage: lead.stage, followUp: lead.nextFollowUp, details: lead.customData,
      })),
      bookings: data.deals.slice(0, 20).map((deal) => ({
        title: deal.title, valueINR: deal.value, stage: deal.stage, probability: deal.probability,
      })),
      tasks: data.tasks.filter((task) => task.status !== "completed").slice(0, 20).map((task) => ({
        title: task.title, dueAt: task.dueAt, priority: task.priority, relatedTo: task.relatedTo,
      })),
    };
    const answer = await askAiGateway([
      {
        role: "system",
        content: [
          "You are the AI business assistant for The Adventure Pinnacle, a travel agency in Kerala, India.",
          "Answer using only the CRM context supplied. Do not invent bookings, availability, customer facts, prices, or revenue.",
          "Use Indian Rupees (INR) when discussing money. Keep answers practical and concise.",
          "Recommend next actions for enquiries, trip planning, follow-ups, and bookings.",
          "Never reveal or ask for API keys, access tokens, passwords, or other secrets.",
          "If data is missing, say what is missing and what the owner should record.",
        ].join(" "),
      },
      { role: "user", content: `CRM context (JSON):\n${JSON.stringify(context)}\n\nOwner question: ${question}` },
    ], 850);
    return Response.json({ answer });
  } catch (error) {
    console.error("AI assistant failed:", error);
    return Response.json({ error: "AI assistant is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
