import {
  advanceLead,
  assignLead,
  collectPayment,
  completeTask,
  createContact,
  createDeal,
  createLead,
  createTask,
  deleteContact,
  getWorkspaceData,
  moveDeal,
  recordQuickAction,
  updateContact,
  updateLeadStage,
} from "@/lib/crm-data";
import type { IndustryKey } from "@/lib/crm-types";
import { NextRequest } from "next/server";
import { getAuthenticatedSession, isSameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const industries = new Set<IndustryKey>(["adventure", "homigo"]);

function getIndustry(value: unknown): IndustryKey {
  if (typeof value === "string" && industries.has(value as IndustryKey)) return value as IndustryKey;
  return "homigo";
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function GET(request: NextRequest) {
  if (!(await getAuthenticatedSession())) return Response.json({ error: "Authentication required" }, { status: 401 });
  const industry = getIndustry(request.nextUrl.searchParams.get("industry"));
  const data = await getWorkspaceData(industry);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await getAuthenticatedSession())) return Response.json({ error: "Authentication required" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const industry = getIndustry(body.industry);
    const action = text(body.action);

    if (action === "createLead") {
      if (!text(body.name).trim() || !text(body.phone).trim()) {
        return Response.json({ error: "Name and phone are required" }, { status: 400 });
      }
      return Response.json(await createLead({
        organizationSlug: industry,
        name: text(body.name),
        phone: text(body.phone),
        email: text(body.email),
        source: text(body.source, "Other"),
        priority: text(body.priority, "Medium"),
        expectedValue: Number(body.expectedValue ?? 0),
        nextFollowUp: body.nextFollowUp ? text(body.nextFollowUp) : undefined,
        customData: typeof body.customData === "object" && body.customData ? body.customData as Record<string, string> : {},
      }));
    }

    if (action === "createTask") {
      if (!text(body.title).trim() || !body.dueAt) {
        return Response.json({ error: "Title and due date are required" }, { status: 400 });
      }
      return Response.json(await createTask({
        organizationSlug: industry,
        title: text(body.title),
        type: text(body.type, "Task"),
        priority: text(body.priority, "Medium"),
        dueAt: text(body.dueAt),
        relatedName: body.relatedName ? text(body.relatedName) : undefined,
      }));
    }

    if (action === "completeTask") return Response.json(await completeTask(industry, Number(body.id)));
    if (action === "advanceLead") return Response.json(await advanceLead(industry, Number(body.id)));
    if (action === "quickAction") return Response.json(await recordQuickAction(industry, Number(body.id), text(body.quickAction, "note")));
    if (action === "collectPayment") return Response.json(await collectPayment(industry, Number(body.id)));

    if (action === "createContact") {
      if (!text(body.name).trim() || !text(body.phone).trim()) {
        return Response.json({ error: "Name and phone are required" }, { status: 400 });
      }
      return Response.json(await createContact({
        organizationSlug: industry,
        name: text(body.name),
        phone: text(body.phone),
        email: text(body.email),
        company: text(body.company),
        segment: text(body.segment, "Active"),
        totalValue: Number(body.totalValue ?? 0),
      }));
    }

    if (action === "updateContact") {
      return Response.json(await updateContact(industry, Number(body.id), {
        name: text(body.name) || undefined,
        phone: text(body.phone) || undefined,
        email: body.email !== undefined ? text(body.email) : undefined,
        company: body.company !== undefined ? text(body.company) : undefined,
        segment: text(body.segment) || undefined,
        totalValue: body.totalValue !== undefined ? Number(body.totalValue) : undefined,
      }));
    }

    if (action === "deleteContact") return Response.json(await deleteContact(industry, Number(body.id)));

    if (action === "createDeal") {
      if (!text(body.title).trim() || !body.stageId || !body.expectedCloseAt) {
        return Response.json({ error: "Title, stage and expected close date are required" }, { status: 400 });
      }
      return Response.json(await createDeal({
        organizationSlug: industry,
        title: text(body.title),
        company: text(body.company),
        contactId: body.contactId ? Number(body.contactId) : null,
        value: Number(body.value ?? 0),
        stageId: Number(body.stageId),
        expectedCloseAt: text(body.expectedCloseAt),
        priority: text(body.priority, "Medium"),
        probability: Number(body.probability ?? 50),
        source: text(body.source, "Referral"),
      }));
    }

    if (action === "moveDeal") return Response.json(await moveDeal(industry, Number(body.id), Number(body.stageId)));
    if (action === "assignLead") return Response.json(await assignLead(industry, Number(body.id), Number(body.assignedToId)));
    if (action === "updateLeadStage") return Response.json(await updateLeadStage(industry, Number(body.id), Number(body.stageId)));

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("CRM action failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 500 });
  }
}
