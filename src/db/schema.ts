import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    industry: text("industry").notNull(),
    businessType: text("business_type").notNull().default("Private company"),
    country: text("country").notNull().default("India"),
    currency: text("currency").notNull().default("INR"),
    employeeCount: integer("employee_count").notNull().default(1),
    locationCount: integer("location_count").notNull().default(1),
    accent: text("accent").notNull().default("#2f6fed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("organizations_slug_idx").on(table.slug)],
);

export const branches = pgTable(
  "branches",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    city: text("city").notNull(),
    isHeadOffice: boolean("is_head_office").notNull().default(false),
  },
  (table) => [index("branches_org_idx").on(table.organizationId)],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("employee"),
    title: text("title").notNull().default("Team member"),
    avatar: text("avatar").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("users_org_idx").on(table.organizationId),
    uniqueIndex("users_org_email_idx").on(table.organizationId, table.email),
  ],
);

export const pipelines = pgTable(
  "pipelines",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    entityLabel: text("entity_label").notNull().default("Lead"),
    isDefault: boolean("is_default").notNull().default(true),
  },
  (table) => [index("pipelines_org_idx").on(table.organizationId)],
);

export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: serial("id").primaryKey(),
    pipelineId: integer("pipeline_id").notNull().references(() => pipelines.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#64748b"),
    position: integer("position").notNull(),
    isWon: boolean("is_won").notNull().default(false),
    isLost: boolean("is_lost").notNull().default(false),
  },
  (table) => [index("stages_pipeline_idx").on(table.pipelineId)],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email"),
    phone: text("phone").notNull(),
    segment: text("segment").notNull().default("Active"),
    totalValue: integer("total_value").notNull().default(0),
    customData: jsonb("custom_data").$type<Record<string, string>>().notNull().default({}),
    lastContactAt: timestamp("last_contact_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customers_org_idx").on(table.organizationId)],
);

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    pipelineId: integer("pipeline_id").notNull().references(() => pipelines.id, { onDelete: "cascade" }),
    stageId: integer("stage_id").notNull().references(() => pipelineStages.id, { onDelete: "restrict" }),
    assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    company: text("company"),
    phone: text("phone").notNull(),
    email: text("email"),
    source: text("source").notNull().default("Other"),
    priority: text("priority").notNull().default("Medium"),
    expectedValue: integer("expected_value").notNull().default(0),
    nextFollowUp: timestamp("next_follow_up", { withTimezone: true }),
    notes: text("notes"),
    customData: jsonb("custom_data").$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("leads_org_idx").on(table.organizationId),
    index("leads_stage_idx").on(table.stageId),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: text("type").notNull().default("Task"),
    priority: text("priority").notNull().default("Medium"),
    status: text("status").notNull().default("open"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_org_idx").on(table.organizationId),
    index("tasks_assignee_idx").on(table.assignedToId),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    actorId: integer("actor_id").references(() => users.id, { onDelete: "set null" }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("activities_org_idx").on(table.organizationId)],
);

export const quotations = pgTable(
  "quotations",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    quoteNumber: text("quote_number").notNull(),
    title: text("title").notNull(),
    amount: integer("amount").notNull(),
    tax: integer("tax").notNull().default(0),
    status: text("status").notNull().default("Draft"),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quotes_org_idx").on(table.organizationId),
    uniqueIndex("quotes_org_number_idx").on(table.organizationId, table.quoteNumber),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    reference: text("reference").notNull(),
    description: text("description").notNull(),
    totalAmount: integer("total_amount").notNull(),
    paidAmount: integer("paid_amount").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("Pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("payments_org_idx").on(table.organizationId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    actionLabel: text("action_label"),
    severity: text("severity").notNull().default("info"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notifications_org_idx").on(table.organizationId)],
);

export const deals = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    contactId: integer("contact_id").references(() => customers.id, { onDelete: "set null" }),
    stageId: integer("stage_id").notNull().references(() => pipelineStages.id, { onDelete: "restrict" }),
    ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    company: text("company").notNull().default(""),
    value: integer("value").notNull().default(0),
    priority: text("priority").notNull().default("Medium"),
    probability: integer("probability").notNull().default(50),
    source: text("source").notNull().default("Referral"),
    expectedCloseAt: timestamp("expected_close_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("deals_org_idx").on(table.organizationId),
    index("deals_stage_idx").on(table.stageId),
  ],
);

export const placementDetails = pgTable(
  "placement_details",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
    maidId: integer("maid_id").references(() => customers.id, { onDelete: "set null" }),
    clientId: integer("client_id").references(() => customers.id, { onDelete: "set null" }),
    serviceRequestId: integer("service_request_id").references(() => leads.id, { onDelete: "set null" }),
    startAt: timestamp("start_at", { withTimezone: true }),
    endAt: timestamp("end_at", { withTimezone: true }),
    schedule: text("schedule").notNull().default("To be confirmed"),
    workerPay: integer("worker_pay").notNull().default(0),
    clientFee: integer("client_fee").notNull().default(0),
    status: text("status").notNull().default("Scheduled"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("placement_details_deal_unique").on(table.dealId),
    index("placement_details_org_idx").on(table.organizationId),
    index("placement_details_maid_idx").on(table.maidId),
    index("placement_details_client_idx").on(table.clientId),
  ],
);

export const customFields = pgTable(
  "custom_fields",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    label: text("label").notNull(),
    fieldKey: text("field_key").notNull(),
    fieldType: text("field_type").notNull().default("text"),
    isRequired: boolean("is_required").notNull().default(false),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("custom_fields_org_idx").on(table.organizationId),
    uniqueIndex("custom_fields_key_idx").on(table.organizationId, table.entityType, table.fieldKey),
  ],
);


export const leadMessages = pgTable(
  "lead_messages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    leadId: integer("lead_id").references(() => leads.id, { onDelete: "set null" }),
    platform: text("platform").notNull(),
    externalMessageId: text("external_message_id").notNull(),
    externalConversationId: text("external_conversation_id"),
    senderId: text("sender_id").notNull(),
    senderName: text("sender_name"),
    direction: text("direction").notNull().default("inbound"),
    messageText: text("message_text").notNull().default(""),
    mediaType: text("media_type").notNull().default("text"),
    aiSummary: text("ai_summary"),
    aiIntent: text("ai_intent"),
    aiDestination: text("ai_destination"),
    aiTravelDate: text("ai_travel_date"),
    aiGroupSize: integer("ai_group_size"),
    aiBudget: integer("ai_budget"),
    aiPriority: text("ai_priority"),
    aiReplySuggestion: text("ai_reply_suggestion"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_messages_platform_message_unique").on(table.platform, table.externalMessageId),
    index("lead_messages_org_received_idx").on(table.organizationId, table.receivedAt),
    index("lead_messages_lead_received_idx").on(table.leadId, table.receivedAt),
  ],
);

export const integrationCredentials = pgTable(
  "integration_credentials",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    appId: text("app_id"),
    appSecretCiphertext: text("app_secret_ciphertext").notNull(),
    accessTokenCiphertext: text("access_token_ciphertext"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("integration_credentials_org_provider_unique").on(table.organizationId, table.provider)],
);
