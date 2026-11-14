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
  pipelines,
  pipelineStages,
  quotations,
  tasks,
  users,
} from "@/db/schema";
import { deriveCompanies, scoreLead } from "@/lib/derive";
import { demoOrganizations, getFallbackWorkspace, industryProfiles } from "@/lib/industry-data";
import type {
  CreateContactInput,
  CreateDealInput,
  CreateLeadInput,
  CreateTaskInput,
  IndustryKey,
  WorkspaceData,
} from "@/lib/crm-types";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

const iso = (date: Date | null | undefined) => (date ? date.toISOString() : null);

export async function ensureDemoData() {
  const existing = await db.select({ id: organizations.id }).from(organizations).limit(1);
  if (existing.length) return;

  for (const demo of demoOrganizations) {
    const sample = getFallbackWorkspace(demo.slug);
    await db.transaction(async (tx) => {
      const [organization] = await tx.insert(organizations).values({
        name: sample.organization.name,
        slug: sample.organization.slug,
        industry: sample.organization.industry,
        businessType: "Private company",
        country: sample.organization.country,
        currency: sample.organization.currency,
        employeeCount: sample.organization.employees,
        locationCount: sample.organization.locations,
        accent: sample.organization.accent,
      }).returning();

      const [branch] = await tx.insert(branches).values({
        organizationId: organization.id,
        name: "Head Office",
        city: demo.slug === "real-estate" ? "Kochi" : demo.slug === "retail" ? "Bengaluru" : "Kozhikode",
        isHeadOffice: true,
      }).returning();

      const userMap = new Map<number, number>();
      for (const member of sample.team) {
        const [row] = await tx.insert(users).values({
          organizationId: organization.id,
          branchId: branch.id,
          name: member.name,
          email: `${member.name.toLowerCase().replace(/[^a-z]+/g, ".")}@${organization.slug}.demo`,
          role: member.role.toLowerCase(),
          title: member.title,
          avatar: member.avatar,
        }).returning();
        userMap.set(member.id, row.id);
      }

      const [pipeline] = await tx.insert(pipelines).values({
        organizationId: organization.id,
        name: sample.profile.pipelineName,
        entityLabel: sample.profile.leadLabel,
        isDefault: true,
      }).returning();

      const stageMap = new Map<number, number>();
      for (const stage of sample.stages) {
        const [row] = await tx.insert(pipelineStages).values({
          pipelineId: pipeline.id,
          name: stage.name,
          color: stage.color,
          position: stage.position,
          isWon: stage.isWon,
          isLost: stage.isLost,
        }).returning();
        stageMap.set(stage.id, row.id);
      }

      const customerMap = new Map<number, number>();
      for (const customer of sample.customers) {
        const owner = sample.team.find((member) => member.name === customer.owner);
        const [row] = await tx.insert(customers).values({
          organizationId: organization.id,
          ownerId: owner ? userMap.get(owner.id) : null,
          name: customer.name,
          company: customer.company,
          phone: customer.phone,
          email: customer.email,
          segment: customer.segment,
          totalValue: customer.totalValue,
          customData: customer.customData,
          lastContactAt: new Date(customer.lastContactAt),
        }).returning();
        customerMap.set(customer.id, row.id);
      }

      const leadMap = new Map<number, number>();
      for (const lead of sample.leads) {
        const [row] = await tx.insert(leads).values({
          organizationId: organization.id,
          pipelineId: pipeline.id,
          stageId: stageMap.get(lead.stageId)!,
          assignedToId: lead.assignedToId ? userMap.get(lead.assignedToId) : null,
          name: lead.name,
          company: lead.company,
          phone: lead.phone,
          email: lead.email,
          source: lead.source,
          priority: lead.priority,
          expectedValue: lead.expectedValue,
          nextFollowUp: lead.nextFollowUp ? new Date(lead.nextFollowUp) : null,
          notes: lead.notes,
          customData: lead.customData,
          createdAt: new Date(lead.createdAt),
        }).returning();
        leadMap.set(lead.id, row.id);
      }

      for (const task of sample.tasks) {
        const relatedLead = sample.leads.find((lead) => lead.name === task.relatedTo);
        const relatedCustomer = sample.customers.find((customer) => customer.name === task.relatedTo);
        await tx.insert(tasks).values({
          organizationId: organization.id,
          assignedToId: task.assignedToId ? userMap.get(task.assignedToId) : null,
          leadId: relatedLead ? leadMap.get(relatedLead.id) : null,
          customerId: relatedCustomer ? customerMap.get(relatedCustomer.id) : null,
          title: task.title,
          type: task.type,
          priority: task.priority,
          status: task.status,
          dueAt: new Date(task.dueAt),
          completedAt: task.status === "completed" ? new Date(task.dueAt) : null,
        });
      }

      for (const quote of sample.quotations) {
        const relatedLead = sample.leads.find((lead) => lead.name === quote.customer);
        const relatedCustomer = sample.customers.find((customer) => customer.name === quote.customer);
        await tx.insert(quotations).values({
          organizationId: organization.id,
          customerId: relatedCustomer ? customerMap.get(relatedCustomer.id) : null,
          leadId: relatedLead ? leadMap.get(relatedLead.id) : null,
          quoteNumber: quote.quoteNumber,
          title: quote.title,
          amount: quote.amount,
          tax: quote.tax,
          status: quote.status,
          validUntil: new Date(quote.validUntil),
        });
      }

      for (const payment of sample.payments) {
        const customer = sample.customers.find((item) => item.name === payment.customer);
        await tx.insert(payments).values({
          organizationId: organization.id,
          customerId: customer ? customerMap.get(customer.id) : null,
          assignedToId: userMap.get(sample.team[1].id),
          reference: payment.reference,
          description: payment.description,
          totalAmount: payment.totalAmount,
          paidAmount: payment.paidAmount,
          dueAt: new Date(payment.dueAt),
          status: payment.status,
        });
      }

      for (const deal of sample.deals) {
        const contact = sample.customers.find((customer) => customer.name === deal.contact);
        const owner = sample.team.find((member) => member.name === deal.owner);
        const stage = sample.stages.find((item) => item.name === deal.stage);
        if (!stage) continue;
        await tx.insert(deals).values({
          organizationId: organization.id,
          contactId: contact ? customerMap.get(contact.id) ?? null : null,
          stageId: stageMap.get(stage.id)!,
          ownerId: owner ? userMap.get(owner.id) ?? null : null,
          title: deal.title,
          company: deal.company,
          value: deal.value,
          priority: deal.priority,
          probability: deal.probability,
          source: deal.source,
          expectedCloseAt: new Date(deal.expectedCloseAt),
        });
      }

      for (const activity of sample.activities) {
        const actor = sample.team.find((member) => member.name === activity.actor);
        await tx.insert(activities).values({
          organizationId: organization.id,
          actorId: actor ? userMap.get(actor.id) : null,
          leadId: activity.leadId ? leadMap.get(activity.leadId) : null,
          customerId: activity.customerId ? customerMap.get(activity.customerId) : null,
          type: activity.type,
          title: activity.title,
          detail: activity.detail,
          createdAt: new Date(activity.createdAt),
        });
      }

      await tx.insert(notifications).values(sample.notifications.map((notification) => ({
        organizationId: organization.id,
        userId: userMap.get(sample.team[0].id),
        title: notification.title,
        detail: notification.detail,
        actionLabel: notification.actionLabel,
        severity: notification.severity,
        isRead: notification.isRead,
        createdAt: new Date(notification.createdAt),
      })));

      await tx.insert(customFields).values(sample.profile.customFields.map((field, index) => ({
        organizationId: organization.id,
        entityType: "lead",
        label: field.label,
        fieldKey: field.key,
        fieldType: field.key.toLowerCase().includes("date") ? "date" : "text",
        position: index,
      })));
    });
  }
}

async function ensureDealSeed() {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(deals);
  if ((row?.count ?? 0) > 0) return;

  for (const demo of demoOrganizations) {
    const [organization] = await db.select().from(organizations).where(eq(organizations.slug, demo.slug)).limit(1);
    if (!organization) continue;
    const [pipeline] = await db.select().from(pipelines).where(and(eq(pipelines.organizationId, organization.id), eq(pipelines.isDefault, true))).limit(1);
    if (!pipeline) continue;
    const [stageRows, userRows, customerRows] = await Promise.all([
      db.select().from(pipelineStages).where(eq(pipelineStages.pipelineId, pipeline.id)),
      db.select().from(users).where(eq(users.organizationId, organization.id)),
      db.select().from(customers).where(eq(customers.organizationId, organization.id)),
    ]);
    const sample = getFallbackWorkspace(demo.slug);
    const values = sample.deals.flatMap((deal) => {
      const stage = stageRows.find((item) => item.name === deal.stage);
      if (!stage) return [];
      const contact = customerRows.find((item) => item.name === deal.contact);
      const owner = userRows.find((item) => item.name === deal.owner);
      return [{
        organizationId: organization.id,
        contactId: contact?.id ?? null,
        stageId: stage.id,
        ownerId: owner?.id ?? null,
        title: deal.title,
        company: deal.company,
        value: deal.value,
        priority: deal.priority,
        probability: deal.probability,
        source: deal.source,
        expectedCloseAt: new Date(deal.expectedCloseAt),
      }];
    });
    if (values.length) await db.insert(deals).values(values);
  }
}

export async function getWorkspaceData(slug: IndustryKey = "insurance"): Promise<WorkspaceData> {
  try {
    await ensureDemoData();
    try {
      await ensureDealSeed();
    } catch (error) {
      console.warn("Demo data backfill skipped:", error instanceof Error ? error.message : error);
    }
    const [organization] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (!organization) return getFallbackWorkspace(slug);

    const [userRows, pipelineRows, customerRows, dealRows, leadRows, taskRows, paymentRows, quoteRows, activityRows, notificationRows] = await Promise.all([
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
    ]);

    const pipeline = pipelineRows[0];
    const stageRows = pipeline
      ? await db.select().from(pipelineStages).where(eq(pipelineStages.pipelineId, pipeline.id)).orderBy(asc(pipelineStages.position))
      : [];
    const userById = new Map(userRows.map((user) => [user.id, user]));
    const stageById = new Map(stageRows.map((stage) => [stage.id, stage]));
    const customerById = new Map(customerRows.map((customer) => [customer.id, customer]));
    const leadById = new Map(leadRows.map((lead) => [lead.id, lead]));
    const fallback = getFallbackWorkspace(slug);
    const performanceByName = new Map(fallback.team.map((member) => [member.name, member]));

    const team = userRows.map((user) => {
      const performance = performanceByName.get(user.name);
      return {
        id: user.id,
        name: user.name,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        title: user.title,
        avatar: user.avatar,
        leads: performance?.leads ?? leadRows.filter((lead) => lead.assignedToId === user.id).length,
        tasksDone: performance?.tasksDone ?? taskRows.filter((task) => task.assignedToId === user.id && task.status === "completed").length,
        revenue: performance?.revenue ?? 0,
        trend: performance?.trend ?? 0,
      };
    });

    const mappedCustomers = customerRows.map((customer) => {
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
    console.warn("Using CRM fallback data during database bootstrap:", error instanceof Error ? error.message : error);
    return getFallbackWorkspace(slug);
  }
}

async function resolveOrganization(slug: IndustryKey) {
  await ensureDemoData();
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
    customData: {},
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
  patch: { name?: string; phone?: string; email?: string; company?: string; segment?: string; totalValue?: number },
) {
  const organization = await resolveOrganization(slug);
  const [contact] = await db.update(customers).set({
    ...(patch.name ? { name: patch.name.trim() } : {}),
    ...(patch.phone ? { phone: patch.phone.trim() } : {}),
    ...(patch.email !== undefined ? { email: patch.email.trim() || null } : {}),
    ...(patch.company !== undefined ? { company: patch.company.trim() || null } : {}),
    ...(patch.segment ? { segment: patch.segment } : {}),
    ...(patch.totalValue !== undefined ? { totalValue: patch.totalValue } : {}),
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
  await db.insert(activities).values({
    organizationId: organization.id, actorId: owner?.id ?? null, customerId: input.contactId,
    type: "deal", title: "Deal created", detail: `${deal.title} added to ${stage.name}`,
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
