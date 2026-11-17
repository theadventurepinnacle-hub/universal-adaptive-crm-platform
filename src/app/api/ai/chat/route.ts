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
    const data = await getWorkspaceData("homigo");
    const context = {
      business: data.organization.name,
      today: new Date().toISOString().slice(0, 10),
      totals: {
        enquiries: data.leads.length,
        clients: data.customers.length,
        maidProfiles: data.maids.length,
        placements: data.deals.length,
        pipelineValueINR: data.deals.reduce((sum, deal) => sum + deal.value, 0),
        paymentsPendingINR: data.payments.reduce((sum, payment) => sum + Math.max(0, payment.totalAmount - payment.paidAmount), 0),
        openTasks: data.tasks.filter((task) => task.status !== "completed").length,
      },
      enquiries: data.leads.slice(0, 30).map((lead) => ({
        name: lead.name, source: lead.source, priority: lead.priority, score: lead.score,
        stage: lead.stage, followUp: lead.nextFollowUp, details: lead.customData,
      })),
      placements: data.deals.slice(0, 30).map((deal) => ({
        title: deal.title, client: deal.contact, maid: deal.maidName || "Not assigned",
        startAt: deal.startAt, schedule: deal.schedule, clientFeeINR: deal.clientFee ?? deal.value,
        workerPayINR: deal.workerPay ?? 0, status: deal.placementStatus || deal.stage,
      })),
      maidDirectory: data.maids.slice(0, 50).map((maid) => ({
        name: maid.name, phone: maid.phone, location: maid.location, skills: maid.serviceTypes,
        availability: maid.availability, age: maid.age,
      })),

      tasks: data.tasks.filter((task) => task.status !== "completed").slice(0, 20).map((task) => ({
        title: task.title, dueAt: task.dueAt, priority: task.priority, relatedTo: task.relatedTo,
      })),
    };
    const answer = await askAiGateway([
      {
        role: "system",
        content: [
          "You are the AI operations assistant for HOMIGO, a maid supply and home staffing agency in Kerala, India.",
          "Answer using only the CRM context supplied. Do not invent maid availability, worker verification, client requirements, salaries, service fees, placements, or payments.",
          "Use Indian Rupees (INR) when discussing money. Keep answers practical and concise.",
          "Recommend practical next actions for client requirements, maid matching by location and skills, availability checks, placement follow-ups, schedules and collections. Never claim a worker is available unless the CRM says so.",
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
