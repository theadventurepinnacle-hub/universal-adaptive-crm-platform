"use client";

import { OwnerDashboard } from "@/components/dashboard";
import {
  AssistantPanel, CommandPalette, CompanyDrawer, ConfirmDialog, ContactModal, CustomerDrawer, DealModal,
  LeadDrawer, ManualInvoiceModal, NotificationsPanel, QuickAddModal, RecordPaymentModal, InvoicePreviewModal,
} from "@/components/overlays";
import { Avatar } from "@/components/ui";
import { MaidDirectoryView } from "@/components/maid-directory";
import { AttendanceView } from "@/components/attendance-view";
import {
  CalendarView, CompaniesView, ContactsView, DealsView, LeadsView, MoreView, PaymentsView, PipelineView,
  QuotationsView, ReportsView, SettingsView, TasksView,
} from "@/components/views";
import type { CustomerView, DealView, LeadView, WorkspaceData } from "@/lib/crm-types";
import {
  BarChart3, Bell, Boxes, Building2, CalendarDays, Check, ChevronDown, ChevronRight, CircleDollarSign,
  FileText, Handshake, KeyRound, LayoutDashboard, LayoutGrid, ListChecks, LogOut, Menu, Home,
  Package, Plus, RefreshCw, Search, Settings, ShieldCheck, Sparkles, Target, TrendingUp, Truck, Users,
  Wallet, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type ViewKey = "dashboard" | "contacts" | "maids" | "companies" | "leads" | "deals" | "pipeline" | "tasks" | "calendar" | "reports" | "quotations" | "payments" | "settings" | "more";

type NavItem = { key: ViewKey; label: string; icon: LucideIcon; badge?: number };

const pageTitles: Record<ViewKey, string> = {
  dashboard: "Dashboard", contacts: "Clients", maids: "Maid Directory", companies: "Partner Accounts", leads: "Service Requests", deals: "Placements",
  pipeline: "Placement Pipeline", tasks: "Tasks & Follow-ups", calendar: "Attendance & Schedule", reports: "Reports",
  quotations: "Service Agreements", payments: "Payments & Dues", settings: "Settings", more: "More",
};

const industryIcons: Record<string, LucideIcon> = { shield: ShieldCheck, refresh: RefreshCw, file: FileText, wallet: Wallet, building: Building2, calendar: CalendarDays, key: KeyRound, grid: LayoutGrid, package: Package, boxes: Boxes, bag: FileText, truck: Truck, users: Users };

function Logo({ compact = false, brandName = "HOMIGO" }: { compact?: boolean; brandName?: string }) {
  return <div className="brand"><span className="brand-mark"><Home size={17} strokeWidth={2.2} /></span>{!compact && <span className="brand-text">{brandName}</span>}</div>;
}

export default function CrmApp({ initialData }: { initialData: WorkspaceData }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<ViewKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState<"side" | "top" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<"lead" | "task" | null>(null);
  const [contactModal, setContactModal] = useState<{ contact: CustomerView | null } | null>(null);
  const [dealModal, setDealModal] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [recordPaymentId, setRecordPaymentId] = useState<number | null>(null);
  const [previewPaymentId, setPreviewPaymentId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerView | null>(null);
  const [recordDeleteTarget, setRecordDeleteTarget] = useState<{ type: "lead" | "deal"; id: number; name: string } | null>(null);
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
      if (event.key === "Escape") { setSearchOpen(false); setProfileMenu(null); }
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
  const collect = (id: number) => { setRecordPaymentId(id); };
  const saveRecordedPayment = async (payload: Record<string, unknown>) => {
    const success = await mutate(payload, "Payment recorded and invoice balance updated");
    if (success) setRecordPaymentId(null);
  };
  const saveManualInvoice = async (payload: Record<string, unknown>) => {
    const success = await mutate(payload, "Invoice created and client account updated");
    if (success) {
      setInvoiceModalOpen(false);
      const response = await fetch("/api/crm?industry=" + data.organization.slug, { cache: "no-store" });
      if (response.ok) {
        const refreshed = await response.json() as WorkspaceData;
        setData(refreshed);
        const latestInvoice = [...refreshed.payments].sort((a, b) => b.id - a.id)[0];
        if (latestInvoice) setPreviewPaymentId(latestInvoice.id);
      }
    }
  };
  const saveContact = async (payload: Record<string, unknown>) => {
    const success = await mutate(payload, payload.action === "createContact" ? "Client added" : "Client updated");
    if (success) setContactModal(null);
  };
  const saveMaid = async (payload: Record<string, unknown>, success: string) => mutate(payload, success);
  const saveAttendance = async (payload: Record<string, unknown>, success: string) => mutate(payload, success);
  const saveDeal = async (payload: Record<string, unknown>) => {
    const success = await mutate(payload, "Deal added to pipeline");
    if (success) setDealModal(false);
  };
  const submitQuickAdd = async (payload: Record<string, unknown>) => {
    const success = await mutate(payload, payload.action === "createLead" ? `${data.profile.leadLabel} created and assigned` : "Task added to your day");
    if (success) setQuickAdd(null);
  };
  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed");
      window.location.assign("/");
    } catch {
      showToast("Could not sign out. Please try again.");
    }
  };

  const shownUser = data.currentUser;

  const selectedLead = data.leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const selectedContact = data.customers.find((contact) => contact.id === selectedContactId) ?? null;
  const selectedCompany = data.companies.find((company) => company.id === selectedCompanyId) ?? null;
  const openTasks = data.tasks.filter((task) => task.status !== "completed").length;
  const unread = data.notifications.filter((notification) => !notification.isRead).length;

  const navGroups: Array<{ label: string; items: NavItem[] }> = data.organization.slug === "homigo"
    ? [
        { label: "OVERVIEW", items: [
          { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { key: "contacts", label: "Clients", icon: Users },
          { key: "maids", label: "Maid Directory", icon: ShieldCheck, badge: data.maids.length },
        ] },
        { label: "SERVICE OPERATIONS", items: [
          { key: "leads", label: "Service Requests", icon: Target, badge: data.leads.length },
          { key: "deals", label: "Placements", icon: Handshake, badge: data.deals.length },
          { key: "pipeline", label: "Placement Pipeline", icon: TrendingUp },
        ] },
        { label: "WORKSPACE", items: [{ key: "tasks", label: "Tasks & Follow-ups", icon: ListChecks, badge: openTasks }, { key: "calendar", label: "Attendance & Schedule", icon: CalendarDays }, { key: "reports", label: "Reports", icon: BarChart3 }] },
        { label: "FINANCE", items: [{ key: "quotations", label: "Service Agreements", icon: FileText }, { key: "payments", label: "Payments & Dues", icon: Wallet }] },
      ]
    : [
        { label: "OVERVIEW", items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { key: "contacts", label: "Travellers", icon: Users }, { key: "companies", label: "Travel Partners", icon: Building2 }] },
        { label: "ENQUIRIES & BOOKINGS", items: [{ key: "leads", label: "Enquiries", icon: Target, badge: data.leads.length }, { key: "deals", label: "Trip Bookings", icon: Handshake, badge: data.deals.length }, { key: "pipeline", label: "Booking Pipeline", icon: TrendingUp }] },
        { label: "WORKSPACE", items: [{ key: "tasks", label: "Tasks", icon: ListChecks, badge: openTasks }, { key: "calendar", label: "Calendar", icon: CalendarDays }, { key: "reports", label: "Reports", icon: BarChart3 }] },
        { label: "FINANCE", items: [{ key: "quotations", label: "Service Agreements", icon: FileText }, { key: "payments", label: "Payments", icon: Wallet }] },
      ];

  const profileMenuContent = (
    <>
      <div className="menu-profile"><Avatar name={shownUser.name} size="sm" /><div><strong>{shownUser.name}</strong><small>Workspace owner</small></div></div>
      <button onClick={() => { setProfileMenu(null); void logout(); }}><LogOut size={14} /> Sign out</button>
    </>
  );

  return (
    <div className="shell">
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <Logo brandName={data.organization.name} />
          <button className="icon-btn sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={17} /></button>
        </div>

        <div className="ws-wrap">
          <div className="ws-switch" aria-label="HOMIGO agency workspace">
            <span className="workspace-logo" style={{ background: "#A3E635", color: "#17210b" }}>HO</span>
            <div><strong>HOMIGO</strong><small>Maid Supply &amp; Home Services</small></div>
          </div>
        </div>

        <nav className="nav-scroll">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map((item) => (
                <button key={item.key} className={`nav-item ${view === item.key ? "active" : ""}`} onClick={() => navigate(item.key)}>
                  <item.icon size={17} /><span>{item.label}</span>
                  {!!item.badge && <em className="nav-badge">{item.badge}</em>}
                </button>
              ))}
            </div>
          ))}
          <p className="nav-label">{data.organization.industry.toUpperCase()}</p>
          {data.profile.modules.map((module) => {
            const Icon = industryIcons[module.icon] ?? Package;
            const moduleView: Record<string, ViewKey> = { "Maid Directory": "maids", "Service Requests": "leads", "Placements": "deals", "Attendance & Schedule": "calendar" };
            return <button key={module.label} className={`nav-item ${view === moduleView[module.label] ? "active" : ""}`} onClick={() => moduleView[module.label] ? navigate(moduleView[module.label]) : navigate("more")}><Icon size={17} /><span>{module.label}</span><ChevronRight size={13} className="nav-chev" /></button>;
          })}
        </nav>

        <div className="sidebar-foot">
          <button className={`nav-item ${view === "settings" ? "active" : ""}`} onClick={() => navigate("settings")}><Settings size={17} /><span>Settings</span></button>
          <button className="side-profile" onClick={() => setProfileMenu((open) => open === "side" ? null : "side")}>
            <Avatar name={shownUser.name} size="sm" />
            <div><strong>{shownUser.name}</strong><small>Owner</small></div>
            <ChevronDown size={13} />
          </button>
          {profileMenu === "side" && <div className="side-menu">{profileMenuContent}</div>}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <button className="mobile-brand" onClick={() => navigate("dashboard")}><Logo compact brandName={data.organization.name} /><span className="mobile-org">{data.organization.name}</span></button>
            <button className="top-search" onClick={() => setSearchOpen(true)}><Search size={16} /><span>Search here...</span><kbd>⌘ K</kbd></button>
          </div>
          <h1 className="top-title">{data.organization.slug === "adventure" ? ({ dashboard: "Dashboard", contacts: "Travellers", companies: "Travel Partners", maids: "Staff Directory", leads: "Enquiries", deals: "Trip Bookings", pipeline: "Booking Pipeline", tasks: "Tasks", calendar: "Calendar", reports: "Reports", quotations: "Quotations", payments: "Payments", settings: "Settings", more: "More" } as Record<ViewKey, string>)[view] : pageTitles[view]}</h1>
          <div className="top-right">
            <button className="assistant-pill" onClick={() => setAssistantOpen(true)}><Sparkles size={14} /><span>Assistant</span></button>
            <button className="icon-btn bell" onClick={() => setNotificationsOpen(true)} aria-label="Notifications"><Bell size={18} />{unread > 0 && <i className="ping" />}</button>
            <button className="top-profile" onClick={() => setProfileMenu((open) => open === "top" ? null : "top")}>
              <Avatar name={shownUser.name} size="sm" />
              <div className="top-profile-text"><strong>{shownUser.name}</strong><small>Workspace owner</small></div>
              <ChevronDown size={13} />
            </button>
            {profileMenu === "top" && <div className="top-menu">{profileMenuContent}</div>}
          </div>
        </header>

        <main className="content">
          {view === "dashboard" && (
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
          {view === "contacts" && <ContactsView data={data} onAdd={() => setContactModal({ contact: null })} onView={(contact) => setSelectedContactId(contact.id)} onEdit={(contact) => setContactModal({ contact })} onDelete={setDeleteTarget} />}
          {view === "maids" && <MaidDirectoryView data={data} onSave={saveMaid} />}
          {view === "companies" && <CompaniesView data={data} onView={(company) => setSelectedCompanyId(company.id)} onToast={showToast} />}
          {view === "leads" && <LeadsView data={data} onAdd={() => setQuickAdd("lead")} onView={(lead) => setSelectedLeadId(lead.id)} onAssign={assignLead} onStage={stageLead} onAction={quickAction} onDelete={(lead) => setRecordDeleteTarget({ type: "lead", id: lead.id, name: lead.name })} />}
          {view === "deals" && <DealsView data={data} onAdd={() => setDealModal(true)} onOpen={(deal) => { if (deal.contactId) setSelectedContactId(deal.contactId); else showToast(`${deal.title} · ${deal.stage}`); }} onStage={(deal, stageId) => moveDeal(deal, stageId)} onDelete={(deal) => setRecordDeleteTarget({ type: "deal", id: deal.id, name: deal.title })} />}
          {view === "pipeline" && <PipelineView data={data} onOpen={(deal) => { if (deal.contactId) setSelectedContactId(deal.contactId); }} onSettings={() => navigate("settings")} />}
          {view === "tasks" && <TasksView data={data} onAdd={() => setQuickAdd("task")} onComplete={completeTask} />}
          {view === "calendar" && (data.organization.slug === "homigo"
            ? <AttendanceView data={data} onSave={saveAttendance} />
            : <CalendarView data={data} onAdd={() => setQuickAdd("task")} onComplete={completeTask} />)}
          {view === "reports" && <ReportsView data={data} onToast={showToast} />}
          {view === "quotations" && <QuotationsView data={data} onToast={showToast} />}
          {view === "payments" && <PaymentsView data={data} onCollect={collect} onAddClient={() => setContactModal({ contact: null })} onNewInvoice={() => setInvoiceModalOpen(true)} onRecordPayment={(id) => setRecordPaymentId(id)} onPreviewInvoice={(id) => setPreviewPaymentId(id)} />}
          {view === "settings" && <SettingsView data={data} onToast={showToast} />}
          {view === "more" && <MoreView data={data} onNavigate={navigate} onToast={showToast} />}
        </main>
      </div>

      <nav className="bottom-nav">
        {[{ key: "dashboard" as const, label: "Home", icon: LayoutDashboard }, { key: "contacts" as const, label: "Clients", icon: Users }, { key: "maids" as const, label: "Maids", icon: ShieldCheck }, { key: "tasks" as const, label: "Tasks", icon: ListChecks }, { key: "more" as const, label: "More", icon: LayoutGrid }].map((item) => (
          <button key={item.key} className={view === item.key ? "active" : ""} onClick={() => navigate(item.key)}><item.icon size={19} /><span>{item.label}</span></button>
        ))}
      </nav>
      <button className="fab" onClick={() => setQuickAdd("lead")} aria-label="Quick add"><Plus size={23} /></button>

      {quickAdd && <QuickAddModal data={data} initialType={quickAdd} onClose={() => setQuickAdd(null)} onSubmit={submitQuickAdd} />}
      {contactModal && <ContactModal data={data} contact={contactModal.contact} onClose={() => setContactModal(null)} onSave={saveContact} />}
      {dealModal && <DealModal data={data} onClose={() => setDealModal(false)} onSave={saveDeal} />}
      {invoiceModalOpen && <ManualInvoiceModal data={data} onClose={() => setInvoiceModalOpen(false)} onSave={saveManualInvoice} />}
      {recordPaymentId !== null && <RecordPaymentModal data={data} initialPaymentId={recordPaymentId} onClose={() => setRecordPaymentId(null)} onSave={saveRecordedPayment} />}
      {previewPaymentId !== null && (() => {
        const payment = data.payments.find((item) => item.id === previewPaymentId);
        return payment ? <InvoicePreviewModal organizationName={data.organization.name} payment={payment} onClose={() => setPreviewPaymentId(null)} /> : null;
      })()}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.name}?`}
          detail="The contact and its linked activity will be removed from this workspace."
          confirmLabel="Delete contact"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => { const target = deleteTarget; setDeleteTarget(null); setSelectedContactId(null); void mutate({ action: "deleteContact", id: target.id }, `${target.name} deleted`); }}
        />
      )}
      {recordDeleteTarget && (
        <ConfirmDialog
          title={recordDeleteTarget.type === "lead" ? "Delete this service request?" : "Delete this placement?"}
          detail={recordDeleteTarget.type === "lead"
            ? `“${recordDeleteTarget.name}” and its linked follow-up tasks will be removed. The client/maid directory records will not be deleted.`
            : `“${recordDeleteTarget.name}” and its linked placement schedule/attendance records will be removed. Client and maid profiles will remain.`}
          confirmLabel={recordDeleteTarget.type === "lead" ? "Delete request" : "Delete placement"}
          onCancel={() => setRecordDeleteTarget(null)}
          onConfirm={() => {
            const target = recordDeleteTarget;
            setRecordDeleteTarget(null);
            void mutate({ action: target.type === "lead" ? "deleteLead" : "deleteDeal", id: target.id },
              target.type === "lead" ? "Service request deleted" : "Placement deleted");
          }}
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
      {assistantOpen && <AssistantPanel data={data} employeeMode={false} onClose={() => setAssistantOpen(false)} />}
      {notificationsOpen && <NotificationsPanel data={data} onClose={() => setNotificationsOpen(false)} />}
      {searchOpen && <CommandPalette data={data} onClose={() => setSearchOpen(false)} onNavigate={navigate} onOpenLead={(lead) => setSelectedLeadId(lead.id)} onOpenContact={(contact) => setSelectedContactId(contact.id)} onOpenDeal={(deal) => { if (deal.contactId) setSelectedContactId(deal.contactId); }} />}
      {busy && <div className="busy"><span /></div>}
      {toast && <div className="toast"><span><Check size={13} /></span>{toast}</div>}
    </div>
  );
}
