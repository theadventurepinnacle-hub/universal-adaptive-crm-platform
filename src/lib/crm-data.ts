import "server-only";

import { db } from "@/db";
import {
  activities,
  branches,
  customFields,
  customers,
  deals,
  leads,
  notifications,
  organizations,
  payments,
  placementDetails,
  pipelines,
  pipelineStages,
  quotations,
  tasks,
  users,
} from "@/db/schema";
import { deriveCompanies, scoreLead } from "@/lib/derive";
import { industryProfiles } from "@/lib/industry-data";
import type {
  CreateContactInput,
  CreateDealInput,
  CreateLeadInput,
  CreateTaskInput,
  IndustryKey,
  WorkspaceData,
} from "@/lib/crm-types";
import { and, asc, desc, eq, ne } from "drizzle-orm";

const iso = (date: Date | null | undefined) => (date ? date.toISOString() : null);

export async function getWorkspaceData(slug: IndustryKey = "adventure"): Promise<WorkspaceData> {
  try {
    const [organization] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (!organization) throw new Error("The Adventure Pinnacle workspace is not configured");

    const [userRows, pipelineRows, customerRows, dealRows, leadRows, taskRows, paymentRows, quoteRows, activityRows, notificationRows, placementRows] = await Promise.all([
      db.select().from(users).where(eq(users.organizationId, organization.id)).orderBy(asc(users.id)),
      db.select().from(pipelines).where(and(eq(pipelines.organizationId, organization.id), eq(pipelines.isDefault, true))).limit(1),
      db.select().from(customers).where(eq(customers.organizationId, organization.id)).orderBy(desc(customers.lastContactAt)),
      db.select().from(deals).where(eq(deals.organizationId, organization.id)).orderBy(desc(deals.expectedCloseAt)),
      db.select().from(leads).where(eq(leads.organizationId, organization.id)).orderBy(desc(leads.updatedAt)),
      db.select().from(tasks).where(eq(tasks.organizationId, organization.id)).orderBy(asc(tasks.dueAt)),
      db.select().from(payments).where(eq(payments.organizationId, organization.id)).orderBy(asc(payments.dueAt)),
      db.select().from(quotations).where(eq(quotations.organizationId, organization.id)).orderBy(desc(quotations.createdAt)),
      db.select().from(activities).where(eq(activities.organizationId, organization.id)).orderBy(desc(activities.createdAt)),
      db.select().from(notifications).where(eq(notifications.organizationId, organization.id)).orderBy(desc(notifications.createdAt)),
      db.select().from(placementDetails).where(eq(placementDetails.organizationId, organization.id)).orderBy(desc(placementDetails.createdAt)),
    ]);

    const pipeline = pipelineRows[0];
    const stageRows = pipeline
      ? await db.select().from(pipelineStages).where(eq(pipelineStages.pipelineId, pipeline.id)).orderBy(asc(pipelineStages.position))
      : [];
    const userById = new Map(userRows.map((user) => [user.id, user]));
    const stageById = new Map(stageRows.map((stage) => [stage.id, stage]));
    const customerById = new Map(customerRows.map((customer) => [customer.id, customer]));
    const leadById = new Map(leadRows.map((lead) => [lead.id, lead]));
    const placementByDealId = new Map(placementRows.map((placement) => [placement.dealId, placement]));
    const team = userRows.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      title: user.title,
      avatar: user.avatar,
      leads: leadRows.filter((lead) => lead.assignedToId === user.id).length,
      tasksDone: taskRows.filter((task) => task.assignedToId === user.id && task.status === "completed").length,
      revenue: 0,
      trend: 0,
    }));

    const maidRows = slug === "homigo"
      ? customerRows.filter((customer) => customer.customData?.record_type === "staff")
      : [];
    const clientRows = slug === "homigo"
      ? customerRows.filter((customer) => customer.customData?.record_type !== "staff")
      : customerRows;
    const mappedMaids = maidRows.map((maid) => {
      const meta = maid.customData || {};
      return {
        id: maid.id,
        name: maid.name,
        phone: maid.phone,
        age: meta.age == null ? "" : String(meta.age),
        location: meta.location == null ? "" : String(meta.location),
        serviceTypes: String(meta.service_types || meta.service_type || "Not specified"),
        availability: String(meta.availability || "Not confirmed"),
        workNotes: String(meta.work_notes || ""),
        verificationNote: String(meta.verification_note || ""),
        source: String(meta.source || "Manual entry"),
        avatar: maid.name.split(" ").map((part) => part[0]).join("").slice(0, 2),
      };
    });
    const mappedCustomers = clientRows.map((customer) => {
      const owner = customer.ownerId ? userById.get(customer.ownerId) : null;
      return {
        id: customer.id,
        name: customer.name,
        company: customer.company ?? "",
        phone: customer.phone,
        email: customer.email ?? "",
        segment: customer.segment,
        totalValue: customer.totalValue,
        owner: owner?.name ?? "Unassigned",
        avatar: customer.name.split(" ").map((part) => part[0]).join("").slice(0, 2),
        customData: customer.customData,
        lastContactAt: customer.lastContactAt.toISOString(),
      };
    });

    const mappedLeads = leadRows.map((lead) => {
      const assignee = lead.assignedToId ? userById.get(lead.assignedToId) : null;
      const stage = stageById.get(lead.stageId);
      return {
        id: lead.id,
        name: lead.name,
        company: lead.company ?? "",
        phone: lead.phone,
        email: lead.email ?? "",
        source: lead.source,
        priority: lead.priority,
        expectedValue: lead.expectedValue,
        nextFollowUp: iso(lead.nextFollowUp),
        notes: lead.notes ?? "",
        stageId: lead.stageId,
        stage: stage?.name ?? "New",
        stageColor: stage?.color ?? "#8290a5",
        assignedToId: lead.assignedToId,
        assignee: assignee?.name ?? "Unassigned",
        avatar: assignee?.avatar ?? "?",
        customData: lead.customData,
        createdAt: lead.createdAt.toISOString(),
      };
    }).map((lead) => ({ ...lead, score: scoreLead(lead) }));

    const mappedDeals = dealRows.map((deal) => {
      const stage = stageById.get(deal.stageId);
      const owner = deal.ownerId ? userById.get(deal.ownerId) : null;
      const contact = deal.contactId ? customerById.get(deal.contactId) : null;
      const placement = placementByDealId.get(deal.id);
      const maid = placement?.maidId ? customerById.get(placement.maidId) : null;
      return {
        id: deal.id,
        title: deal.title,
        value: deal.value,
        stageId: deal.stageId,
        stage: stage?.name ?? "New",
        stageColor: stage?.color ?? "#7d8580",
        company: deal.company || contact?.company || "",
        contact: contact?.name ?? "Contact",
        contactId: deal.contactId,
        expectedCloseAt: deal.expectedCloseAt.toISOString(),
        owner: owner?.name ?? "Unassigned",
        avatar: owner?.avatar ?? "?",
        priority: deal.priority,
        probability: deal.probability,
        source: deal.source,
        maidId: placement?.maidId ?? null,
        maidName: maid?.name ?? "",
        startAt: placement?.startAt?.toISOString() ?? null,
        schedule: placement?.schedule ?? "",
        workerPay: placement?.workerPay ?? 0,
        clientFee: placement?.clientFee ?? deal.value,
        placementStatus: placement?.status ?? "",
        placementNotes: placement?.notes ?? "",
      };
    });

    const organizationView = {
      id: organization.id,
      name: organization.name,
      slug,
      industry: organization.industry,
      currency: organization.currency,
      country: organization.country,
      employees: organization.employeeCount,
      locations: organization.locationCount,
      accent: organization.accent,
    };
    const companies = deriveCompanies(mappedCustomers, mappedDeals, organizationView);

    return {
      organization: organizationView,
      profile: industryProfiles[slug],
      currentUser: team.find((member) => member.role.toLowerCase() === "owner") ?? team[0],
      team,
      stages: stageRows.map((stage) => ({ id: stage.id, name: stage.name, color: stage.color, position: stage.position, isWon: stage.isWon, isLost: stage.isLost })),
      leads: mappedLeads,
      customers: mappedCustomers,
      maids: mappedMaids,
      deals: mappedDeals,
      companies,
      tasks: taskRows.map((task) => {
        const assignee = task.assignedToId ? userById.get(task.assignedToId) : null;
        const relatedLead = task.leadId ? leadById.get(task.leadId) : null;
        const relatedCustomer = task.customerId ? customerById.get(task.customerId) : null;
        return {
          id: task.id, title: task.title, type: task.type, priority: task.priority, status: task.status,
          dueAt: task.dueAt.toISOString(), relatedTo: relatedLead?.name ?? relatedCustomer?.name ?? "General",
          assignee: assignee?.name ?? "Unassigned", assignedToId: task.assignedToId,
        };
      }),
      payments: paymentRows.map((payment) => ({
        id: payment.id, reference: payment.reference, customer: payment.customerId ? customerById.get(payment.customerId)?.name ?? "Customer" : "Customer",
        description: payment.description, totalAmount: payment.totalAmount, paidAmount: payment.paidAmount,
        dueAt: payment.dueAt.toISOString(), status: payment.status,
      })),
      quotations: quoteRows.map((quote) => ({
        id: quote.id, quoteNumber: quote.quoteNumber,
        customer: quote.leadId ? leadById.get(quote.leadId)?.name ?? "Customer" : quote.customerId ? customerById.get(quote.customerId)?.name ?? "Customer" : "Customer",
        title: quote.title, amount: quote.amount, tax: quote.tax, status: quote.status, validUntil: quote.validUntil.toISOString(),
      })),
      activities: activityRows.map((activity) => ({
        id: activity.id, type: activity.type, title: activity.title, detail: activity.detail ?? "",
        actor: activity.actorId ? userById.get(activity.actorId)?.name ?? "System" : "System", customerId: activity.customerId,
        leadId: activity.leadId, createdAt: activity.createdAt.toISOString(),
      })),
      notifications: notificationRows.map((notification) => ({
        id: notification.id, title: notification.title, detail: notification.detail, actionLabel: notification.actionLabel ?? "Open",
        severity: notification.severity, isRead: notification.isRead, createdAt: notification.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("CRM workspace data could not be loaded:", error);
    throw error;
  }
}

async function resolveOrganization(slug: IndustryKey) {
  const [organization] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  if (!organization) throw new Error("Organization not found");
  return organization;
}

export async function createLead(input: CreateLeadInput) {
  const organization = await resolveOrganization(input.organizationSlug);
  const [pipeline] = await db.select().from(pipelines).where(and(eq(pipelines.organizationId, organization.id), eq(pipelines.isDefault, true))).limit(1);
  const [firstStage] = await db.select().from(pipelineStages).where(eq(pipelineStages.pipelineId, pipeline.id)).orderBy(asc(pipelineStages.position)).limit(1);
  const [assignee] = await db.select().from(users).where(and(eq(users.organizationId, organization.id), ne(users.role, "owner"))).orderBy(asc(users.id)).limit(1);
  const [lead] = await db.insert(leads).values({
    organizationId: organization.id,
    pipelineId: pipeline.id,
    stageId: firstStage.id,
    assignedToId: assignee?.id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    source: input.source,
    priority: input.priority,
    expectedValue: input.expectedValue,
    nextFollowUp: input.nextFollowUp ? new Date(input.nextFollowUp) : null,
    customData: input.customData ?? {},
    notes: "Created from quick add",
  }).returning();

  await db.insert(activities).values({
    organizationId: organization.id,
    actorId: assignee?.id,
    leadId: lead.id,
    type: "lead",
    title: `${industryProfiles[input.organizationSlug].leadLabel} created`,
    detail: `Automatically assigned to ${assignee?.name ?? "the team"}`,
  });

  if (input.nextFollowUp) {
    await db.insert(tasks).values({
      organizationId: organization.id,
      assignedToId: assignee?.id,
      leadId: lead.id,
      title: `First follow-up with ${lead.name}`,
      type: "Follow-up",
      priority: input.priority,
      dueAt: new Date(input.nextFollowUp),
    });
  }

  await db.insert(notifications).values({
    organizationId: organization.id,
    userId: assignee?.id,
    title: "New lead assigned",
    detail: `${lead.name} was assigned to you`,
    actionLabel: "View lead",
    severity: "info",
  });
  return getWorkspaceData(input.organizationSlug);
}

export async function createTask(input: CreateTaskInput) {
  const organization = await resolveOrganization(input.organizationSlug);
  const [assignee] = await db.select().from(users).where(and(eq(users.organizationId, organization.id), ne(users.role, "owner"))).orderBy(asc(users.id)).limit(1);
  let leadId: number | null = null;
  if (input.relatedName) {
    const [lead] = await db.select().from(leads).where(and(eq(leads.organizationId, organization.id), eq(leads.name, input.relatedName))).limit(1);
    leadId = lead?.id ?? null;
  }
  await db.insert(tasks).values({
    organizationId: organization.id,
    assignedToId: assignee?.id,
    leadId,
    title: input.title.trim(),
    type: input.type,
    priority: input.priority,
    dueAt: new Date(input.dueAt),
  });
  return getWorkspaceData(input.organizationSlug);
}

export async function completeTask(slug: IndustryKey, taskId: number) {
  const organization = await resolveOrganization(slug);
  const [task] = await db.update(tasks).set({ status: "completed", completedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id))).returning();
  if (task) {
    await db.insert(activities).values({
      organizationId: organization.id, actorId: task.assignedToId, leadId: task.leadId, customerId: task.customerId,
      type: "complete", title: "Task completed", detail: task.title,
    });
  }
  return getWorkspaceData(slug);
}

export async function advanceLead(slug: IndustryKey, leadId: number) {
  const organization = await resolveOrganization(slug);
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.organizationId, organization.id))).limit(1);
  if (!lead) throw new Error("Lead not found");
  const stages = await db.select().from(pipelineStages).where(eq(pipelineStages.pipelineId, lead.pipelineId)).orderBy(asc(pipelineStages.position));
  const currentIndex = stages.findIndex((stage) => stage.id === lead.stageId);
  const nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)];
  await db.update(leads).set({ stageId: nextStage.id, updatedAt: new Date() }).where(eq(leads.id, lead.id));
  await db.insert(activities).values({
    organizationId: organization.id, actorId: lead.assignedToId, leadId: lead.id,
    type: "stage", title: `Moved to ${nextStage.name}`, detail: "Pipeline updated with one tap",
  });
  if (nextStage.isWon) {
    const [existingCustomer] = await db.select().from(customers).where(and(eq(customers.organizationId, organization.id), eq(customers.phone, lead.phone))).limit(1);
    if (!existingCustomer) {
      await db.insert(customers).values({
        organizationId: organization.id, ownerId: lead.assignedToId, name: lead.name, company: lead.company,
        phone: lead.phone, email: lead.email, segment: "New", totalValue: lead.expectedValue, customData: lead.customData,
      });
    }
  }
  return getWorkspaceData(slug);
}

export async function recordQuickAction(slug: IndustryKey, leadId: number, action: string) {
  const organization = await resolveOrganization(slug);
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.organizationId, organization.id))).limit(1);
  if (!lead) throw new Error("Lead not found");
  const labels: Record<string, string> = { call: "Called customer", whatsapp: "WhatsApp message", note: "Note added", followup: "Follow-up scheduled", quote: "Quotation prepared" };
  await db.insert(activities).values({
    organizationId: organization.id, actorId: lead.assignedToId, leadId: lead.id, type: action,
    title: labels[action] ?? "Activity recorded", detail: `${lead.name} · recorded from quick action`,
  });
  if (action === "followup") {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 1);
    await db.update(leads).set({ nextFollowUp: dueAt, updatedAt: new Date() }).where(eq(leads.id, lead.id));
    await db.insert(tasks).values({
      organizationId: organization.id, assignedToId: lead.assignedToId, leadId: lead.id,
      title: `Follow up with ${lead.name}`, type: "Follow-up", priority: lead.priority, dueAt,
    });
  }
  return getWorkspaceData(slug);
}

export async function collectPayment(slug: IndustryKey, paymentId: number) {
  const organization = await resolveOrganization(slug);
  const [payment] = await db.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.organizationId, organization.id))).limit(1);
  if (!payment) throw new Error("Payment not found");
  await db.update(payments).set({ paidAmount: payment.totalAmount, status: "Paid" }).where(eq(payments.id, payment.id));
  await db.insert(activities).values({
    organizationId: organization.id, actorId: payment.assignedToId, customerId: payment.customerId,
    type: "payment", title: "Payment collected", detail: `${payment.reference} marked as paid`,
  });
  return getWorkspaceData(slug);
}

export async function createMaid(input: {
  organizationSlug: IndustryKey;
  name: string;
  phone: string;
  age?: string;
  location?: string;
  serviceTypes?: string;
  availability?: string;
  workNotes?: string;
}) {
  if (input.organizationSlug !== "homigo") throw new Error("Maid profiles are available in the HOMIGO workspace only");
  const organization = await resolveOrganization(input.organizationSlug);
  const [owner] = await db.select().from(users).where(and(eq(users.organizationId, organization.id), eq(users.role, "owner"))).limit(1);
  const customData: Record<string, string> = {
    record_type: "staff",
    age: input.age?.trim() || "",
    location: input.location?.trim() || "",
    service_types: input.serviceTypes?.trim() || "",
    availability: input.availability?.trim() || "Not confirmed",
    work_notes: input.workNotes?.trim() || "",
    source: "Manual entry",
    import_status: "Not imported",
    verification_note: "Not verified",
  };
  const [maid] = await db.insert(customers).values({
    organizationId: organization.id,
    ownerId: owner?.id ?? null,
    name: input.name.trim(),
    phone: input.phone.trim(),
    segment: "Staff",
    totalValue: 0,
    customData,
  }).returning();
  await db.insert(activities).values({
    organizationId: organization.id,
    actorId: owner?.id ?? null,
    customerId: maid.id,
    type: "contact",
    title: "Maid profile created",
    detail: `${maid.name} added to HOMIGO maid directory`,
  });
  return getWorkspaceData(input.organizationSlug);
}

export async function updateMaid(slug: IndustryKey, maidId: number, patch: {
  name?: string;
  phone?: string;
  age?: string;
  location?: string;
  serviceTypes?: string;
  availability?: string;
  workNotes?: string;
}) {
  if (slug !== "homigo") throw new Error("Maid profiles are available in the HOMIGO workspace only");
  const organization = await resolveOrganization(slug);
  const [existing] = await db.select().from(customers).where(
    and(eq(customers.id, maidId), eq(customers.organizationId, organization.id)),
  ).limit(1);
  if (!existing || existing.customData?.record_type !== "staff") throw new Error("Maid profile not found");
  const customData = { ...(existing.customData || {}) } as Record<string, string>;
  if (patch.age !== undefined) customData.age = patch.age;
  if (patch.location !== undefined) customData.location = patch.location;
  if (patch.serviceTypes !== undefined) customData.service_types = patch.serviceTypes;
  if (patch.availability !== undefined) customData.availability = patch.availability;
  if (patch.workNotes !== undefined) customData.work_notes = patch.workNotes;
  const [updated] = await db.update(customers).set({
    ...(patch.name ? { name: patch.name.trim() } : {}),
    ...(patch.phone ? { phone: patch.phone.trim() } : {}),
    customData,
    lastContactAt: new Date(),
  }).where(and(eq(customers.id, maidId), eq(customers.organizationId, organization.id))).returning();
  await db.insert(activities).values({
    organizationId: organization.id,
    actorId: existing.ownerId,
    customerId: updated.id,
    type: "contact",
    title: "Maid profile updated",
    detail: `${updated.name}'s HOMIGO profile was updated`,
  });
  return getWorkspaceData(slug);
}

export async function createContact(input: CreateContactInput) {
  const organization = await resolveOrganization(input.organizationSlug);
  const [owner] = await db.select().from(users).where(and(eq(users.organizationId, organization.id), ne(users.role, "owner"))).orderBy(asc(users.id)).limit(1);
  const [contact] = await db.insert(customers).values({
    organizationId: organization.id,
    ownerId: owner?.id ?? null,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim() || null,
    company: input.company.trim() || null,
    segment: input.segment || "Active",
    totalValue: input.totalValue,
    customData: (input.customData || {}) as Record<string, string>,
  }).returning();
  await db.insert(activities).values({
    organizationId: organization.id, actorId: owner?.id ?? null, customerId: contact.id,
    type: "contact", title: "Contact created", detail: `${contact.name} added to the CRM`,
  });
  return getWorkspaceData(input.organizationSlug);
}

export async function updateContact(
  slug: IndustryKey,
  contactId: number,
  patch: { name?: string; phone?: string; email?: string; company?: string; segment?: string; totalValue?: number; customData?: Record<string, unknown> },
) {
  const organization = await resolveOrganization(slug);
  const [existing] = await db.select().from(customers).where(and(eq(customers.id, contactId), eq(customers.organizationId, organization.id))).limit(1);
  if (!existing) throw new Error("Contact not found");
  const [contact] = await db.update(customers).set({
    ...(patch.name ? { name: patch.name.trim() } : {}),
    ...(patch.phone ? { phone: patch.phone.trim() } : {}),
    ...(patch.email !== undefined ? { email: patch.email.trim() || null } : {}),
    ...(patch.company !== undefined ? { company: patch.company.trim() || null } : {}),
    ...(patch.segment ? { segment: patch.segment } : {}),
    ...(patch.totalValue !== undefined ? { totalValue: patch.totalValue } : {}),
    ...(patch.customData ? { customData: { ...(existing.customData || {}), ...patch.customData } as Record<string, string> } : {}),
  }).where(and(eq(customers.id, contactId), eq(customers.organizationId, organization.id))).returning();
  if (!contact) throw new Error("Contact not found");
  await db.insert(activities).values({
    organizationId: organization.id, actorId: contact.ownerId, customerId: contact.id,
    type: "contact", title: "Contact updated", detail: `${contact.name}'s details were updated`,
  });
  return getWorkspaceData(slug);
}

export async function deleteContact(slug: IndustryKey, contactId: number) {
  const organization = await resolveOrganization(slug);
  const [contact] = await db.delete(customers)
    .where(and(eq(customers.id, contactId), eq(customers.organizationId, organization.id)))
    .returning();
  if (!contact) throw new Error("Contact not found");
  await db.insert(activities).values({
    organizationId: organization.id,
    type: "contact",
    title: "Contact deleted",
    detail: `${contact.name} was removed from the CRM`,
  });
  return getWorkspaceData(slug);
}

export async function createDeal(input: CreateDealInput) {
  const organization = await resolveOrganization(input.organizationSlug);
  const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, input.stageId)).limit(1);
  if (!stage) throw new Error("Pipeline stage not found");
  const [pipeline] = await db.select().from(pipelines).where(and(eq(pipelines.id, stage.pipelineId), eq(pipelines.organizationId, organization.id))).limit(1);
  if (!pipeline) throw new Error("Stage does not belong to this workspace");
  const [owner] = await db.select().from(users).where(and(eq(users.organizationId, organization.id), ne(users.role, "owner"))).orderBy(asc(users.id)).limit(1);

  if (input.organizationSlug === "homigo") {
    if (!input.maidId) throw new Error("Select a maid for this placement");
    const [maid] = await db.select().from(customers).where(and(eq(customers.id, input.maidId), eq(customers.organizationId, organization.id))).limit(1);
    if (!maid || maid.customData?.record_type !== "staff") throw new Error("Selected maid profile was not found");
    if (input.contactId) {
      const [client] = await db.select().from(customers).where(and(eq(customers.id, input.contactId), eq(customers.organizationId, organization.id))).limit(1);
      if (!client || client.customData?.record_type === "staff") throw new Error("Selected client record was not found");
    }
    if (input.serviceRequestId) {
      const [request] = await db.select().from(leads).where(and(eq(leads.id, input.serviceRequestId), eq(leads.organizationId, organization.id))).limit(1);
      if (!request) throw new Error("Selected service request was not found");
    }
  }

  const [deal] = await db.insert(deals).values({
    organizationId: organization.id,
    contactId: input.contactId,
    stageId: input.stageId,
    ownerId: owner?.id ?? null,
    title: input.title.trim(),
    company: input.company.trim(),
    value: input.value,
    priority: input.priority,
    probability: input.probability,
    source: input.source,
    expectedCloseAt: new Date(input.expectedCloseAt),
  }).returning();

  if (input.organizationSlug === "homigo" && input.maidId) {
    await db.insert(placementDetails).values({
      organizationId: organization.id,
      dealId: deal.id,
      maidId: input.maidId,
      clientId: input.contactId,
      serviceRequestId: input.serviceRequestId ?? null,
      startAt: input.startAt ? new Date(input.startAt) : new Date(input.expectedCloseAt),
      schedule: input.schedule?.trim() || "To be confirmed",
      workerPay: Math.max(0, input.workerPay ?? 0),
      clientFee: Math.max(0, input.clientFee ?? input.value),
      status: input.placementStatus?.trim() || "Scheduled",
      notes: input.placementNotes?.trim() || "",
    });
  }

  await db.insert(activities).values({
    organizationId: organization.id, actorId: owner?.id ?? null, customerId: input.contactId,
    type: "deal", title: input.organizationSlug === "homigo" ? "Maid placement created" : "Deal created",
    detail: `${deal.title} added to ${stage.name}`,
  });
  return getWorkspaceData(input.organizationSlug);
}

export async function moveDeal(slug: IndustryKey, dealId: number, stageId: number) {
  const organization = await resolveOrganization(slug);
  const [deal] = await db.select().from(deals).where(and(eq(deals.id, dealId), eq(deals.organizationId, organization.id))).limit(1);
  if (!deal) throw new Error("Deal not found");
  const [stage] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, stageId)).limit(1);
  if (!stage) throw new Error("Stage not found");
  const [pipeline] = await db.select().from(pipelines).where(and(eq(pipelines.id, stage.pipelineId), eq(pipelines.organizationId, organization.id))).limit(1);
  if (!pipeline) throw new Error("Stage does not belong to this workspace");
  await db.update(deals).set({ stageId, probability: stage.isWon ? 100 : deal.probability }).where(eq(deals.id, deal.id));
  if (slug === "homigo") {
    const placementStatus = stage.isLost ? "Cancelled" : stage.name === "Placed" ? "Placed" : stage.isWon ? "Active" : stage.name;
    await db.update(placementDetails).set({ status: placementStatus }).where(eq(placementDetails.dealId, deal.id));
  }
  await db.insert(activities).values({
    organizationId: organization.id, actorId: deal.ownerId, customerId: deal.contactId,
    type: "deal", title: "Deal stage updated", detail: `${deal.title} moved to ${stage.name}`,
  });
  return getWorkspaceData(slug);
}

export async function assignLead(slug: IndustryKey, leadId: number, userId: number) {
  const organization = await resolveOrganization(slug);
  const [member] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.organizationId, organization.id))).limit(1);
  if (!member) throw new Error("Team member not found");
  const [lead] = await db.update(leads).set({ assignedToId: userId, updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.organizationId, organization.id))).returning();
  if (!lead) throw new Error("Lead not found");
  await db.insert(activities).values({
    organizationId: organization.id, actorId: userId, leadId: lead.id,
    type: "assignment", title: "Lead reassigned", detail: `${lead.name} is now owned by ${member.name}`,
  });
  return getWorkspaceData(slug);
}

export async function updateLeadStage(slug: IndustryKey, leadId: number, stageId: number) {
  const organization = await resolveOrganization(slug);
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.organizationId, organization.id))).limit(1);
  if (!lead) throw new Error("Lead not found");
  const [stage] = await db.select().from(pipelineStages).where(and(eq(pipelineStages.id, stageId), eq(pipelineStages.pipelineId, lead.pipelineId))).limit(1);
  if (!stage) throw new Error("Stage not found");
  await db.update(leads).set({ stageId, updatedAt: new Date() }).where(eq(leads.id, lead.id));
  if (stage.isWon) {
    const [existing] = await db.select().from(customers).where(and(eq(customers.organizationId, organization.id), eq(customers.phone, lead.phone))).limit(1);
    if (!existing) {
      await db.insert(customers).values({
        organizationId: organization.id, ownerId: lead.assignedToId, name: lead.name, company: lead.company,
        phone: lead.phone, email: lead.email, segment: "New", totalValue: lead.expectedValue, customData: lead.customData,
      });
    }
  }
  await db.insert(activities).values({
    organizationId: organization.id, actorId: lead.assignedToId, leadId: lead.id,
    type: "stage", title: `Moved to ${stage.name}`, detail: "Pipeline updated from the leads table",
  });
  return getWorkspaceData(slug);
}
