"use client";

import { EmployeeDashboard, OwnerDashboard } from "@/components/dashboard";
import {
  AssistantPanel, CommandPalette, CompanyDrawer, ConfirmDialog, ContactModal, CustomerDrawer, DealModal,
  LeadDrawer, NotificationsPanel, OnboardingModal, QuickAddModal,
} from "@/components/overlays";
import { Avatar } from "@/components/ui";
import {
  CalendarView, CompaniesView, ContactsView, DealsView, LeadsView, MoreView, PaymentsView, PipelineView,
  QuotationsView, ReportsView, SettingsView, TasksView,
} from "@/components/views";
import { demoOrganizations } from "@/lib/industry-data";
import type { AppRole, CustomerView, DealView, IndustryKey, LeadView, WorkspaceData } from "@/lib/crm-types";
import {
  BarChart3, Bell, Boxes, Building2, CalendarDays, Check, ChevronDown, ChevronRight, CircleDollarSign,
  FileText, Handshake, KeyRound, LayoutDashboard, LayoutGrid, ListChecks, LockKeyhole, LogOut, Menu,
  Package, Plus, RefreshCw, Search, Settings, ShieldCheck, Sparkles, Target, TrendingUp, Truck, Users,
  Wallet, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type ViewKey = "dashboard" | "contacts" | "companies" | "leads" | "deals" | "pipeline" | "tasks" | "calendar" | "reports" | "quotations" | "payments" | "settings" | "more";

type NavItem = { key: ViewKey; label: string; icon: LucideIcon; badge?: number };

const pageTitles: Record<ViewKey, string> = {
  dashboard: "Dashboard", contacts: "Contacts", companies: "Companies", leads: "Leads", deals: "Deals",
  pipeline: "Sales Pipeline", tasks: "Tasks", calendar: "Calendar", reports: "Reports",
  quotations: "Quotations", payments: "Payments", settings: "Settings", more: "More",
};

const industryIcons: Record<string, LucideIcon> = { shield: ShieldCheck, refresh: RefreshCw, file: FileText, wallet: Wallet, building: Building2, calendar: CalendarDays, key: KeyRound, grid: LayoutGrid, package: Package, boxes: Boxes, bag: FileText, truck: Truck };

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark"><i /><i /><i /></span>
      {!compact && <span className="brand-text">opero<b>.</b></span>}
    </div>
  );
}

function LoginScreen({ initialIndustry, onLogin }: { initialIndustry: IndustryKey; onLogin: (industry: IndustryKey, role: AppRole) => Promise<void> }) {
  const [industry, setIndustry] = useState<IndustryKey>(initialIndustry);
  const [role, setRole] = useState<AppRole>("owner");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    await onLogin(industry, role);
    setLoading(false);
  };
  return (
    <main className="login">
      <section className="login-story">
        <Logo />
        <div className="login-copy">
          <p className="eyebrow">ONE SIMPLE SYSTEM TO RUN YOUR BUSINESS</p>
          <h1>Your team gets work done.<br />You see the whole picture.</h1>
          <p>Less reporting, fewer spreadsheets and one calm place for contacts, leads, deals, tasks and cash — configured around the way your business actually works.</p>
          <div className="login-points">
            {[["Employee-first", "Work, not data entry"], ["Industry-aware", "Adapts as you switch"], ["Always actionable", "Know the next move"]].map(([title, sub], index) => (
              <div key={title} className="login-point"><span>{index === 0 ? <Check size={13} /> : index === 1 ? <Building2 size={13} /> : <Target size={13} />}</span><div><strong>{title}</strong><small>{sub}</small></div></div>
            ))}
          </div>
        </div>
        <div className="login-preview">
          <div className="preview-head"><div><span className="preview-dot" /><strong>Pipeline forecast</strong></div><span className="badge badge-mint">Live demo</span></div>
          <div className="preview-value">₹1.42Cr<span><TrendingUp size={12} /> 12.8% this month</span></div>
          <div className="preview-bars">{[38, 62, 48, 84, 66, 96, 74].map((height, index) => <i key={index} style={{ height: `${height}%` }} className={index === 5 ? "active" : ""} />)}</div>
          <div className="preview-foot"><span>Contacts <b>148</b></span><span>Deals <b>32</b></span><span>Tasks <b>19</b></span></div>
        </div>
        <p className="login-foot">Business OS for growing teams · Poppins & Naples Yellow design system</p>
      </section>

      <section className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="login-mobile-brand"><Logo /><span className="badge badge-yellow">CRM</span></div>
          <div className="login-form-head"><p className="eyebrow">WELCOME BACK</p><h2>Sign in to your workspace</h2><p>Use a demo account to explore the full product.</p></div>
          <label className="field"><span className="field-label">Email</span><input type="email" defaultValue={role === "owner" ? "owner@opero.demo" : "team@opero.demo"} /></label>
          <label className="field"><span className="field-label">Password</span><div className="input-lock"><LockKeyhole size={14} /><input type="password" defaultValue="demo1234" /></div></label>
          <div>
            <p className="field-label">Demo workspace</p>
            <div className="login-workspaces">
              {demoOrganizations.map((organization) => (
                <button type="button" key={organization.slug} onClick={() => setIndustry(organization.slug)} className={`login-workspace ${industry === organization.slug ? "active" : ""}`}>
                  <span className="workspace-logo" style={{ background: organization.accent }}>{organization.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                  <div><strong>{organization.name}</strong><small>{organization.industry}</small></div>
                  {industry === organization.slug ? <Check size={15} /> : <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="field-label">Sign in as</p>
            <div className="segmented">
              <button type="button" className={role === "owner" ? "active" : ""} onClick={() => setRole("owner")}>Owner / CEO</button>
              <button type="button" className={role === "employee" ? "active" : ""} onClick={() => setRole("employee")}>Employee</button>
            </div>
          </div>
          <button className="btn btn-primary login-submit" disabled={loading}>{loading ? <span className="spinner" /> : <Sparkles size={15} />} Open workspace</button>
          <p className="login-note">Demo access · no account needed</p>
        </form>
      </section>
    </main>
  );
}

export default function CrmApp({ initialData }: { initialData: WorkspaceData }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [role, setRole] = useState<AppRole>("owner");
  const [signedIn, setSignedIn] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wsMenu, setWsMenu] = useState(false);
  const [profileMenu, setProfileMenu] = useState<"side" | "top" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<"lead" | "task" | null>(null);
  const [contactModal, setContactModal] = useState<{ contact: CustomerView | null } | null>(null);
  const [dealModal, setDealModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerView | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setProfileMenu(null); setWsMenu(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigate = (next: string) => {
    setView(next as ViewKey);
    setSidebarOpen(false);
    setProfileMenu(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const switchWorkspace = async (industry: IndustryKey) => {
    if (industry === data.organization.slug) { setWsMenu(false); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/crm?industry=${industry}`);
      if (!response.ok) throw new Error("Could not load workspace");
      const next = await response.json() as WorkspaceData;
      setData(next);
      setView("dashboard");
      setSelectedLeadId(null);
      setSelectedContactId(null);
      setSelectedCompanyId(null);
      setWsMenu(false);
      showToast(`Switched to ${next.organization.name}`);
    } catch {
      showToast("Could not switch workspace");
    } finally {
      setBusy(false);
    }
  };

  const mutate = async (payload: Record<string, unknown>, success: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, industry: data.organization.slug }),
      });
      const next = await response.json() as WorkspaceData & { error?: string };
      if (!response.ok) throw new Error(next.error || "Action failed");
      setData(next);
      showToast(success);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const completeTask = (id: number) => { void mutate({ action: "completeTask", id }, "Task completed"); };
  const quickAction = (lead: LeadView, action: string) => {
    const labels: Record<string, string> = { call: `Call with ${lead.name} logged`, whatsapp: "WhatsApp activity logged", followup: "Follow-up scheduled for tomorrow", note: "Note added to timeline", quote: "Quotation activity created" };
    void mutate({ action: "quickAction", id: lead.id, quickAction: action }, labels[action] ?? "Activity logged");
  };
  const assignLead = (lead: LeadView, userId: number) => { void mutate({ action: "assignLead", id: lead.id, assignedToId: userId }, `${lead.name} reassigned`); };
  const stageLead = (lead: LeadView, stageId: number) => { void mutate({ action: "updateLeadStage", id: lead.id, stageId }, `${lead.name} moved stage`); };
  const moveDeal = (deal: DealView, stageId: number) => {
    const stage = data.stages.find((item) => item.id === stageId);
    void mutate({ action: "moveDeal", id: deal.id, stageId }, `${deal.title} moved to ${stage?.name ?? "new stage"}`);
  };
  const collect = (id: number) => { void mutate({ action: "collectPayment", id }, "Payment marked as collected"); };
  const saveContact = async (payload: Record<string, unknown>) => {
    const success = await mutate(payload, payload.action === "createContact" ? "Contact added" : "Contact updated");
    if (success) setContactModal(null);
  };
  const saveDeal = async (payload: Record<string, unknown>) => {
    const success = await mutate(payload, "Deal added to pipeline");
    if (success) setDealModal(false);
  };
  const submitQuickAdd = async (payload: Record<string, unknown>) => {
    const success = await mutate(payload, payload.action === "createLead" ? `${data.profile.leadLabel} created and assigned` : "Task added to your day");
    if (success) setQuickAdd(null);
  };
  const login = async (industry: IndustryKey, nextRole: AppRole) => {
    if (industry !== data.organization.slug) await switchWorkspace(industry);
    setRole(nextRole);
    setSignedIn(true);
  };

  if (!signedIn) return <LoginScreen initialIndustry={data.organization.slug} onLogin={login} />;

  const employee = data.team.find((member) => member.role.toLowerCase() === "employee") ?? data.team[1] ?? data.team[0];
  const shownUser = role === "owner" ? data.currentUser : employee;
  const selectedLead = data.leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const selectedContact = data.customers.find((contact) => contact.id === selectedContactId) ?? null;
  const selectedCompany = data.companies.find((company) => company.id === selectedCompanyId) ?? null;
  const openTasks = data.tasks.filter((task) => task.status !== "completed").length;
  const unread = data.notifications.filter((notification) => !notification.isRead).length;

  const navGroups: Array<{ label: string; items: NavItem[] }> = [
    { label: "OVERVIEW", items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { key: "contacts", label: "Contacts", icon: Users }, { key: "companies", label: "Companies", icon: Building2 }] },
    { label: "SALES", items: [{ key: "leads", label: "Leads", icon: Target, badge: data.leads.length }, { key: "deals", label: "Deals", icon: Handshake, badge: data.deals.length }, { key: "pipeline", label: "Sales Pipeline", icon: TrendingUp }] },
    { label: "WORKSPACE", items: [{ key: "tasks", label: "Tasks", icon: ListChecks, badge: openTasks }, { key: "calendar", label: "Calendar", icon: CalendarDays }, { key: "reports", label: "Reports", icon: BarChart3 }] },
    { label: "FINANCE", items: [{ key: "quotations", label: "Quotations", icon: FileText }, { key: "payments", label: "Payments", icon: Wallet }] },
  ];

  const profileMenuContent = (
    <>
      <div className="menu-profile"><Avatar name={shownUser.name} size="sm" /><div><strong>{shownUser.name}</strong><small>{shownUser.title}</small></div></div>
      <div className="menu-role">
        <button className={role === "owner" ? "active" : ""} onClick={() => { setRole("owner"); setView("dashboard"); setProfileMenu(null); }}>Owner view</button>
        <button className={role === "employee" ? "active" : ""} onClick={() => { setRole("employee"); setView("dashboard"); setProfileMenu(null); }}>Employee view</button>
      </div>
      <button onClick={() => { setOnboardingOpen(true); setProfileMenu(null); }}><Building2 size={14} /> Add business</button>
      <button onClick={() => { setSignedIn(false); setProfileMenu(null); }}><LogOut size={14} /> Sign out</button>
    </>
  );

  return (
    <div className="shell">
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <Logo />
          <button className="icon-btn sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={17} /></button>
        </div>

        <div className="ws-wrap">
          <button className="ws-switch" onClick={() => setWsMenu((open) => !open)}>
            <span className="workspace-logo" style={{ background: data.organization.accent }}>{data.organization.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
            <div><strong>{data.organization.name}</strong><small>{data.organization.industry} workspace</small></div>
            <ChevronDown size={14} className={wsMenu ? "flip" : ""} />
          </button>
          {wsMenu && (
            <div className="ws-menu">
              <p className="eyebrow">SWITCH BUSINESS</p>
              {demoOrganizations.map((organization) => (
                <button key={organization.slug} onClick={() => void switchWorkspace(organization.slug)} className={organization.slug === data.organization.slug ? "active" : ""}>
                  <span className="workspace-logo" style={{ background: organization.accent }}>{organization.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                  <div><strong>{organization.name}</strong><small>{organization.industry}</small></div>
                  {organization.slug === data.organization.slug && <Check size={14} />}
                </button>
              ))}
              <button className="ws-add" onClick={() => { setWsMenu(false); setOnboardingOpen(true); }}><Plus size={14} /> Add another business</button>
            </div>
          )}
        </div>

        <nav className="nav-scroll">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map((item) => (
                <button key={item.key} className={`nav-item ${view === item.key ? "active" : ""}`} onClick={() => navigate(item.key)}>
                  <item.icon size={17} /><span>{item.key === "leads" ? "Leads" : item.label}</span>
                  {!!item.badge && <em className="nav-badge">{item.badge}</em>}
                </button>
              ))}
            </div>
          ))}
          <p className="nav-label">{data.organization.industry.toUpperCase()}</p>
          {data.profile.modules.map((module) => {
            const Icon = industryIcons[module.icon] ?? Package;
            return <button key={module.label} className="nav-item" onClick={() => { navigate("more"); showToast(`${module.label} module opened`); }}><Icon size={17} /><span>{module.label}</span><ChevronRight size={13} className="nav-chev" /></button>;
          })}
        </nav>

        <div className="sidebar-foot">
          <button className={`nav-item ${view === "settings" ? "active" : ""}`} onClick={() => navigate("settings")}><Settings size={17} /><span>Settings</span></button>
          <button className="side-profile" onClick={() => setProfileMenu((open) => open === "side" ? null : "side")}>
            <Avatar name={shownUser.name} size="sm" />
            <div><strong>{shownUser.name}</strong><small>{role === "owner" ? "Owner" : shownUser.title}</small></div>
            <ChevronDown size={13} />
          </button>
          {profileMenu === "side" && <div className="side-menu">{profileMenuContent}</div>}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <button className="mobile-brand" onClick={() => navigate("dashboard")}><Logo compact /><span className="mobile-org">{data.organization.name}</span></button>
            <button className="top-search" onClick={() => setSearchOpen(true)}><Search size={16} /><span>Search here...</span><kbd>⌘ K</kbd></button>
          </div>
          <h1 className="top-title">{pageTitles[view]}</h1>
          <div className="top-right">
            <button className="assistant-pill" onClick={() => setAssistantOpen(true)}><Sparkles size={14} /><span>Assistant</span></button>
            <button className="icon-btn bell" onClick={() => setNotificationsOpen(true)} aria-label="Notifications"><Bell size={18} />{unread > 0 && <i className="ping" />}</button>
            <button className="top-profile" onClick={() => setProfileMenu((open) => open === "top" ? null : "top")}>
              <Avatar name={shownUser.name} size="sm" />
              <div className="top-profile-text"><strong>{shownUser.name}</strong><small>{role === "owner" ? "Owner / CEO" : shownUser.title}</small></div>
              <ChevronDown size={13} />
            </button>
            {profileMenu === "top" && <div className="top-menu">{profileMenuContent}</div>}
          </div>
        </header>

        <main className="content">
          {view === "dashboard" && role === "owner" && (
            <OwnerDashboard
              data={data}
              onNavigate={navigate}
              onAssistant={() => setAssistantOpen(true)}
              onAddContact={() => setContactModal({ contact: null })}
              onOpenLead={(lead) => setSelectedLeadId(lead.id)}
              onOpenContact={(id) => setSelectedContactId(id)}
              onCompleteTask={completeTask}
            />
          )}
          {view === "dashboard" && role === "employee" && (
            <EmployeeDashboard
              data={data}
              onNavigate={navigate}
              onOpenLead={(lead) => setSelectedLeadId(lead.id)}
              onQuickAction={quickAction}
              onCompleteTask={completeTask}
              onAssistant={() => setAssistantOpen(true)}
            />
          )}
          {view === "contacts" && <ContactsView data={data} onAdd={() => setContactModal({ contact: null })} onView={(contact) => setSelectedContactId(contact.id)} onEdit={(contact) => setContactModal({ contact })} onDelete={setDeleteTarget} />}
          {view === "companies" && <CompaniesView data={data} onView={(company) => setSelectedCompanyId(company.id)} onToast={showToast} />}
          {view === "leads" && <LeadsView data={data} onAdd={() => setQuickAdd("lead")} onView={(lead) => setSelectedLeadId(lead.id)} onAssign={assignLead} onStage={stageLead} onAction={quickAction} />}
          {view === "deals" && <DealsView data={data} onAdd={() => setDealModal(true)} onOpen={(deal) => { if (deal.contactId) setSelectedContactId(deal.contactId); else showToast(`${deal.title} · ${deal.stage}`); }} onStage={(deal, stageId) => moveDeal(deal, stageId)} />}
          {view === "pipeline" && <PipelineView data={data} onOpen={(deal) => { if (deal.contactId) setSelectedContactId(deal.contactId); }} onSettings={() => navigate("settings")} />}
          {view === "tasks" && <TasksView data={data} onAdd={() => setQuickAdd("task")} onComplete={completeTask} />}
          {view === "calendar" && <CalendarView data={data} onAdd={() => setQuickAdd("task")} onComplete={completeTask} />}
          {view === "reports" && <ReportsView data={data} onToast={showToast} />}
          {view === "quotations" && <QuotationsView data={data} onToast={showToast} />}
          {view === "payments" && <PaymentsView data={data} onCollect={collect} />}
          {view === "settings" && <SettingsView data={data} onSwitchIndustry={(slug) => void switchWorkspace(slug)} onToast={showToast} onOpenOnboarding={() => setOnboardingOpen(true)} />}
          {view === "more" && <MoreView data={data} onNavigate={navigate} onToast={showToast} />}
        </main>
      </div>

      <nav className="bottom-nav">
        {[{ key: "dashboard" as const, label: "Home", icon: LayoutDashboard }, { key: "contacts" as const, label: "Contacts", icon: Users }, { key: "deals" as const, label: "Deals", icon: Handshake }, { key: "tasks" as const, label: "Tasks", icon: ListChecks }, { key: "more" as const, label: "More", icon: LayoutGrid }].map((item) => (
          <button key={item.key} className={view === item.key ? "active" : ""} onClick={() => navigate(item.key)}><item.icon size={19} /><span>{item.label}</span></button>
        ))}
      </nav>
      <button className="fab" onClick={() => setQuickAdd("lead")} aria-label="Quick add"><Plus size={23} /></button>

      {quickAdd && <QuickAddModal data={data} initialType={quickAdd} onClose={() => setQuickAdd(null)} onSubmit={submitQuickAdd} />}
      {contactModal && <ContactModal data={data} contact={contactModal.contact} onClose={() => setContactModal(null)} onSave={saveContact} />}
      {dealModal && <DealModal data={data} onClose={() => setDealModal(false)} onSave={saveDeal} />}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.name}?`}
          detail="The contact and its linked activity will be removed from this workspace."
          confirmLabel="Delete contact"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => { const target = deleteTarget; setDeleteTarget(null); setSelectedContactId(null); void mutate({ action: "deleteContact", id: target.id }, `${target.name} deleted`); }}
        />
      )}
      {selectedLead && <LeadDrawer data={data} lead={selectedLead} onClose={() => setSelectedLeadId(null)} onAction={quickAction} onAssign={assignLead} onStage={stageLead} />}
      {selectedContact && (
        <CustomerDrawer
          data={data}
          contact={selectedContact}
          onClose={() => setSelectedContactId(null)}
          onEdit={() => { setSelectedContactId(null); setContactModal({ contact: selectedContact }); }}
          onDelete={() => { setDeleteTarget(selectedContact); }}
        />
      )}
      {selectedCompany && <CompanyDrawer data={data} company={selectedCompany} onClose={() => setSelectedCompanyId(null)} onOpenContact={(contact) => { setSelectedCompanyId(null); setSelectedContactId(contact.id); }} />}
      {assistantOpen && <AssistantPanel data={data} employeeMode={role === "employee"} onClose={() => setAssistantOpen(false)} />}
      {notificationsOpen && <NotificationsPanel data={data} onClose={() => setNotificationsOpen(false)} />}
      {onboardingOpen && <OnboardingModal onClose={() => setOnboardingOpen(false)} onFinish={(businessName, industry) => { setOnboardingOpen(false); showToast(`${businessName} configured with the ${industry} template`); }} />}
      {searchOpen && <CommandPalette data={data} onClose={() => setSearchOpen(false)} onNavigate={navigate} onOpenLead={(lead) => setSelectedLeadId(lead.id)} onOpenContact={(contact) => setSelectedContactId(contact.id)} onOpenDeal={(deal) => { if (deal.contactId) setSelectedContactId(deal.contactId); }} />}
      {busy && <div className="busy"><span /></div>}
      {toast && <div className="toast"><span><Check size={13} /></span>{toast}</div>}
    </div>
  );
}
