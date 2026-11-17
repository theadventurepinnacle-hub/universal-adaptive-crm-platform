export type IndustryKey = "adventure" | "homigo";
export type AppRole = "owner" | "employee";

export type OrganizationView = {
  id: number;
  name: string;
  slug: IndustryKey;
  industry: string;
  currency: string;
  country: string;
  employees: number;
  locations: number;
  accent: string;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  title: string;
  avatar: string;
  leads: number;
  tasksDone: number;
  revenue: number;
  trend: number;
};

export type StageView = {
  id: number;
  name: string;
  color: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
};

export type LeadView = {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  priority: string;
  score: number;
  expectedValue: number;
  nextFollowUp: string | null;
  notes: string;
  stageId: number;
  stage: string;
  stageColor: string;
  assignedToId: number | null;
  assignee: string;
  avatar: string;
  customData: Record<string, string>;
  createdAt: string;
};

export type MaidView = {
  id: number;
  name: string;
  phone: string;
  age: string;
  location: string;
  serviceTypes: string;
  availability: string;
  workNotes: string;
  verificationNote: string;
  source: string;
  avatar: string;
};

export type CustomerView = {
  id: number;
  name: string;
  company: string;
  phone: string;
  email: string;
  segment: string;
  totalValue: number;
  owner: string;
  avatar: string;
  customData: Record<string, string>;
  lastContactAt: string;
};

export type DealView = {
  id: number;
  title: string;
  value: number;
  stageId: number;
  stage: string;
  stageColor: string;
  company: string;
  contact: string;
  contactId: number | null;
  expectedCloseAt: string;
  owner: string;
  avatar: string;
  priority: string;
  probability: number;
  source: string;
  maidId?: number | null;
  maidName?: string;
  startAt?: string | null;
  schedule?: string;
  workerPay?: number;
  clientFee?: number;
  placementStatus?: string;
  placementNotes?: string;
};

export type CompanyView = {
  id: string;
  name: string;
  initials: string;
  contacts: number;
  openDeals: number;
  value: number;
  owner: string;
  location: string;
  industry: string;
  status: string;
};

export type TaskView = {
  id: number;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueAt: string;
  relatedTo: string;
  assignee: string;
  assignedToId: number | null;
};

export type PaymentView = {
  id: number;
  reference: string;
  customer: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueAt: string;
  status: string;
};

export type QuoteView = {
  id: number;
  quoteNumber: string;
  customer: string;
  title: string;
  amount: number;
  tax: number;
  status: string;
  validUntil: string;
};

export type ActivityView = {
  id: number;
  type: string;
  title: string;
  detail: string;
  actor: string;
  customerId: number | null;
  leadId: number | null;
  createdAt: string;
};

export type NotificationView = {
  id: number;
  title: string;
  detail: string;
  actionLabel: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
};

export type AttentionItem = {
  severity: "critical" | "warning" | "notice";
  count: string;
  title: string;
  detail: string;
  action: string;
};

export type ChartPoint = { label: string; value: number };

export type IndustryProfile = {
  label: string;
  eyebrow: string;
  leadLabel: string;
  leadPlural: string;
  maidLabel?: string;
  maidPlural?: string;
  dealLabel?: string;
  dealPlural?: string;
  leadFields?: Array<{ label: string; key: string; type?: string; options?: string[] }>;
  customerLabel: string;
  customerPlural: string;
  productLabel: string;
  pipelineName: string;
  modules: Array<{ label: string; icon: string }>;
  customFields: Array<{ label: string; key: string }>;
  sources: string[];
  attention: AttentionItem[];
  insights: Array<{ title: string; detail: string; tone: "blue" | "green" | "amber" }>;
  chart: ChartPoint[];
};

export type WorkspaceData = {
  organization: OrganizationView;
  profile: IndustryProfile;
  currentUser: TeamMember;
  team: TeamMember[];
  stages: StageView[];
  leads: LeadView[];
  customers: CustomerView[];
  maids: MaidView[];
  deals: DealView[];
  companies: CompanyView[];
  tasks: TaskView[];
  payments: PaymentView[];
  quotations: QuoteView[];
  activities: ActivityView[];
  notifications: NotificationView[];
};

export type CreateLeadInput = {
  organizationSlug: IndustryKey;
  name: string;
  phone: string;
  email?: string;
  source: string;
  priority: string;
  expectedValue: number;
  nextFollowUp?: string;
  customData?: Record<string, string>;
};

export type CreateTaskInput = {
  organizationSlug: IndustryKey;
  title: string;
  type: string;
  priority: string;
  dueAt: string;
  relatedName?: string;
};

export type CreateContactInput = {
  organizationSlug: IndustryKey;
  name: string;
  phone: string;
  email: string;
  company: string;
  segment: string;
  totalValue: number;
  customData?: Record<string, unknown>;
};

export type CreateDealInput = {
  organizationSlug: IndustryKey;
  title: string;
  company: string;
  contactId: number | null;
  value: number;
  stageId: number;
  expectedCloseAt: string;
  priority: string;
  probability: number;
  source: string;
  maidId?: number | null;
  startAt?: string;
  schedule?: string;
  workerPay?: number;
  clientFee?: number;
  serviceRequestId?: number | null;
  placementNotes?: string;
  placementStatus?: string;
};
