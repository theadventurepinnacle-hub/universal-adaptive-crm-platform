"use client";

import { RevenueChart, SourceDonut } from "@/components/dashboard";
import {
  Avatar, Card, CardHead, Empty, ExportButton, PageHead, Priority, Score, SelectField, Status, Tabs,
  Toggle, downloadCsv, formatDate, money, shortDate,
} from "@/components/ui";
import type { CompanyView, CustomerView, DealView, LeadView, StageView, TaskView, WorkspaceData } from "@/lib/crm-types";
import {
  BarChart3, Boxes, Building2, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleDollarSign, Clock3, Download, ExternalLink, Eye, FileText, Handshake, KeyRound,
  LayoutGrid, List, MessageCircle, Package, Pencil, Phone, Plus, ReceiptText, RefreshCw, Search,
  Settings2, Share2, ShieldCheck, Sparkles, Target, Trash2, TrendingUp, Truck, Users, Wallet,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

/* ---------------------------------- contacts --------------------------------- */

export function ContactsView({ data, onAdd, onView, onEdit, onDelete }: {
  data: WorkspaceData;
  onAdd: () => void;
  onView: (contact: CustomerView) => void;
  onEdit: (contact: CustomerView) => void;
  onDelete: (contact: CustomerView) => void;
}) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("All statuses");
  const filtered = useMemo(() => data.customers.filter((contact) => {
    const haystack = `${contact.name} ${contact.company} ${contact.email} ${contact.phone}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (segment === "All statuses" || contact.segment === segment);
  }), [data.customers, query, segment]);

  const exportRows = () => downloadCsv(data.organization.slug === "homigo" ? "homigo-clients.csv" : "travellers.csv", [
    ["Name", "Company", "Email", "Phone", "Status", "Owner", "Value"],
    ...filtered.map((contact) => [contact.name, contact.company, contact.email, contact.phone, contact.segment, contact.owner, contact.totalValue]),
  ]);

  return (
    <div className="page">
      <PageHead
        eyebrow="CLIENT MANAGEMENT"
        title={data.profile.customerPlural}
        subtitle={data.organization.slug === "homigo" ? `${data.customers.length} client records · keep service history and follow-ups together` : `${data.customers.length} travellers across ${data.companies.length} travel partners`}
        actions={<><ExportButton onClick={exportRows} /><button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> {data.organization.slug === "homigo" ? "Add client" : "Add traveller"}</button></>}
      />

      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon mint"><Users size={16} /></span><div><small>{data.profile.customerPlural}</small><strong>{data.customers.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon yellow"><Target size={16} /></span><div><small>{data.organization.slug === "homigo" ? "Active clients" : "Active travellers"}</small><strong>{data.customers.filter((contact) => contact.segment !== "Inactive").length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><Building2 size={16} /></span><div><small>{data.organization.slug === "homigo" ? "Property / account types" : "Companies"}</small><strong>{data.companies.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><Wallet size={16} /></span><div><small>{data.organization.slug === "homigo" ? "Recorded client value" : "Lifetime value"}</small><strong>{money(data.customers.reduce((sum, contact) => sum + contact.totalValue, 0))}</strong></div></div>
      </section>

      <Card pad={false}>
        <div className="table-toolbar">
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={data.organization.slug === "homigo" ? "Search clients, properties, phone..." : "Search travellers, partners, email..."} /></label>
          <div className="toolbar-actions">
            <SelectField ariaLabel="Filter travellers by status" value={segment} onChange={setSegment} options={["All statuses", "Active", "VIP", "Inactive", "New", "Hot Lead"].map((value) => ({ value, label: value }))} />
            <span className="badge badge-gray">{filtered.length} showing</span>
          </div>
        </div>

        <div className="table-wrap desktop-only">
          <table className="data-table">
            <thead><tr><th>{data.profile.customerLabel}</th><th>{data.organization.slug === "homigo" ? "Property type" : "Company"}</th><th>Phone</th><th>Status</th><th>Owner</th><th>Last activity</th><th>Value</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.id}>
                  <td onClick={() => onView(contact)} className="clickable"><div className="person"><Avatar name={contact.name} size="sm" /><div><strong>{contact.name}</strong><small>{data.organization.slug === "homigo" ? [contact.customData.service_type, contact.customData.location, contact.customData.requirement].filter(Boolean).join(" · ") || "Service details pending" : contact.email || "No email"}</small></div></div></td>
                  <td><span className="company-cell"><Building2 size={12} />{contact.company || (data.organization.slug === "homigo" ? "Individual client" : "Individual")}</span></td>
                  <td className="muted">{contact.phone}</td>
                  <td><Status value={contact.segment} /></td>
                  <td>{contact.owner.split(" ")[0]}</td>
                  <td className="muted">{shortDate(contact.lastContactAt)}</td>
                  <td className="strong">{money(contact.totalValue)}</td>
                  <td><div className="row-actions">
                    <button className="icon-action" onClick={() => onView(contact)} aria-label={`View ${contact.name}`}><Eye size={14} /></button>
                    <button className="icon-action" onClick={() => onEdit(contact)} aria-label={`Edit ${contact.name}`}><Pencil size={14} /></button>
                    <button className="icon-action danger" onClick={() => onDelete(contact)} aria-label={`Delete ${contact.name}`}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-only mobile-list">
          {filtered.map((contact) => (
            <div key={contact.id} className="mobile-row">
              <div className="mobile-row-top">
                <button className="person" onClick={() => onView(contact)}><Avatar name={contact.name} size="sm" /><div><strong>{contact.name}</strong><small>{data.organization.slug === "homigo" ? contact.customData.service_type || contact.company || "Cleaning client" : contact.company || contact.email}</small></div></button>
                <Status value={contact.segment} />
              </div>
              <div className="mobile-row-meta"><span>{contact.phone}</span><strong>{money(contact.totalValue)}</strong></div>
              <div className="mobile-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => onView(contact)}><Eye size={13} /> View</button>
                <button className="btn btn-secondary btn-sm" onClick={() => onEdit(contact)}><Pencil size={13} /> Edit</button>
                <button className="btn btn-secondary btn-sm danger-text" onClick={() => onDelete(contact)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        {!filtered.length && <Empty title="No contacts found" detail="Try a different search or status filter." />}
        <div className="table-foot"><span>Showing {filtered.length} of {data.customers.length} contacts</span><span>{data.organization.name} Agency CRM</span></div>
      </Card>
    </div>
  );
}

/* --------------------------------- companies -------------------------------- */

export function CompaniesView({ data, onView, onToast }: { data: WorkspaceData; onView: (company: CompanyView) => void; onToast: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All companies");
  const filtered = data.companies.filter((company) => {
    const matches = `${company.name} ${company.owner} ${company.industry}`.toLowerCase().includes(query.toLowerCase());
    return matches && (status === "All companies" || company.status === status);
  });

  return (
    <div className="page">
      <PageHead
        eyebrow="ACCOUNT MANAGEMENT"
        title="Companies"
        subtitle="Every organization in your CRM, with people and open pipeline rolled up"
        actions={<><ExportButton onClick={() => downloadCsv("companies.csv", [["Company", "Industry", "Contacts", "Open deals", "Value", "Owner", "Status"], ...filtered.map((company) => [company.name, company.industry, company.contacts, company.openDeals, company.value, company.owner, company.status])])} /><button className="btn btn-primary" onClick={() => onToast("Company creation form opened")}><Plus size={16} /> Add company</button></>}
      />

      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon mint"><Building2 size={16} /></span><div><small>Companies</small><strong>{data.companies.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon yellow"><Handshake size={16} /></span><div><small>With open deals</small><strong>{data.companies.filter((company) => company.openDeals > 0).length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><CircleDollarSign size={16} /></span><div><small>Open pipeline</small><strong>{money(data.companies.reduce((sum, company) => sum + company.value, 0))}</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><Users size={16} /></span><div><small>Linked contacts</small><strong>{data.companies.reduce((sum, company) => sum + company.contacts, 0)}</strong></div></div>
      </section>

      <Card pad={false}>
        <div className="table-toolbar">
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies..." /></label>
          <SelectField ariaLabel="Filter companies" value={status} onChange={setStatus} options={["All companies", "Active", "Prospect", "Inactive"].map((value) => ({ value, label: value }))} />
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Company</th><th>Industry</th><th>Contacts</th><th>Open deals</th><th>Pipeline value</th><th>Owner</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.id}>
                  <td onClick={() => onView(company)} className="clickable"><div className="person"><span className="company-logo">{company.initials}</span><div><strong>{company.name}</strong><small>{company.location}</small></div></div></td>
                  <td className="muted">{company.industry}</td>
                  <td>{company.contacts}</td>
                  <td>{company.openDeals}</td>
                  <td className="strong">{money(company.value)}</td>
                  <td>{company.owner.split(" ")[0]}</td>
                  <td><Status value={company.status} /></td>
                  <td><button className="icon-action" onClick={() => onView(company)} aria-label={`View ${company.name}`}><Eye size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <Empty title="No companies found" detail="Adjust the search or status filter." />}
        <div className="table-foot"><span>{filtered.length} companies</span><span>Rollups update automatically</span></div>
      </Card>
    </div>
  );
}

/* ---------------------------------- leads ----------------------------------- */

export function LeadsView({ data, onAdd, onView, onAssign, onStage, onAction }: {
  data: WorkspaceData;
  onAdd: () => void;
  onView: (lead: LeadView) => void;
  onAssign: (lead: LeadView, userId: number) => void;
  onStage: (lead: LeadView, stageId: number) => void;
  onAction: (lead: LeadView, action: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All stages");
  const [source, setSource] = useState("All sources");
  const [sort, setSort] = useState("score");
  const filtered = useMemo(() => data.leads.filter((lead) => {
    const matches = `${lead.name} ${lead.company} ${lead.phone}`.toLowerCase().includes(query.toLowerCase());
    return matches && (stage === "All stages" || lead.stage === stage) && (source === "All sources" || lead.source === source);
  }).sort((a, b) => sort === "value" ? b.expectedValue - a.expectedValue : sort === "recent" ? +new Date(b.createdAt) - +new Date(a.createdAt) : b.score - a.score), [data.leads, query, stage, source, sort]);

  const teamOptions = data.team.map((member) => ({ value: String(member.id), label: member.name }));

  return (
    <div className="page">
      <PageHead
        eyebrow="LEAD MANAGEMENT"
        title={data.profile.leadPlural}
        subtitle={`${data.leads.length} leads · ${money(data.leads.reduce((sum, lead) => sum + lead.expectedValue, 0))} potential value`}
        actions={<><ExportButton onClick={() => downloadCsv("leads.csv", [["Name", "Company", "Phone", "Source", "Score", "Status", "Priority", "Assignee", "Value"], ...filtered.map((lead) => [lead.name, lead.company, lead.phone, lead.source, lead.score, lead.stage, lead.priority, lead.assignee, lead.expectedValue])])} /><button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> Add {data.profile.leadLabel}</button></>}
      />

      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon yellow"><Target size={16} /></span><div><small>Total requests</small><strong>{data.leads.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon mint"><TrendingUp size={16} /></span><div><small>High priority (75+)</small><strong>{data.leads.filter((lead) => lead.score >= 75).length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><Users size={16} /></span><div><small>Unassigned</small><strong>{data.leads.filter((lead) => !lead.assignedToId).length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><CircleDollarSign size={16} /></span><div><small>{data.organization.slug === "homigo" ? "Request value" : "Open value"}</small><strong>{money(data.leads.reduce((sum, lead) => sum + lead.expectedValue, 0))}</strong></div></div>
      </section>

      <Card pad={false}>
        <div className="table-toolbar">
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${data.profile.leadPlural.toLowerCase()}...`} /></label>
          <div className="toolbar-actions">
            <SelectField ariaLabel="Filter by stage" value={stage} onChange={setStage} options={["All stages", ...data.stages.map((item) => item.name)].map((value) => ({ value, label: value }))} />
            <SelectField ariaLabel="Filter by source" value={source} onChange={setSource} options={["All sources", ...data.profile.sources].map((value) => ({ value, label: value }))} />
            <SelectField ariaLabel="Sort leads" value={sort} onChange={setSort} options={[{ value: "score", label: "Score: high → low" }, { value: "value", label: "Value: high → low" }, { value: "recent", label: "Newest first" }]} />
          </div>
        </div>

        <div className="table-wrap desktop-only">
          <table className="data-table leads-table">
            <thead><tr><th>{data.profile.leadLabel}</th><th>Score</th><th>Source</th><th>Status</th><th>Priority</th><th>Value</th><th>Assigned to</th><th>Next follow-up</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td><button className="person row-button" onClick={() => onView(lead)}><Avatar name={lead.name} size="sm" /><div><strong>{lead.name}</strong><small>{lead.company || lead.source}</small></div></button></td>
                  <td><Score value={lead.score} /></td>
                  <td className="muted">{lead.source}</td>
                  <td><span className="select-inline">
                    <select value={String(lead.stageId)} onChange={(event) => onStage(lead, Number(event.target.value))} aria-label={`Stage for ${lead.name}`}>
                      {data.stages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select><ChevronDown size={12} />
                  </span></td>
                  <td><Priority value={lead.priority} /></td>
                  <td className="strong">{money(lead.expectedValue)}</td>
                  <td><span className="select-inline">
                    <select value={String(lead.assignedToId ?? "")} onChange={(event) => onAssign(lead, Number(event.target.value))} aria-label={`Assign ${lead.name}`}>
                      <option value="" disabled>Unassigned</option>
                      {teamOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select><ChevronDown size={12} />
                  </span></td>
                  <td className={lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date() ? "danger-text" : "muted"}>{lead.nextFollowUp ? formatDate(lead.nextFollowUp, true) : "Not set"}</td>
                  <td><div className="row-actions">
                    <button className="icon-action" onClick={() => onAction(lead, "call")} aria-label={`Call ${lead.name}`}><Phone size={14} /></button>
                    <button className="icon-action whatsapp" onClick={() => onAction(lead, "whatsapp")} aria-label={`WhatsApp ${lead.name}`}><MessageCircle size={14} /></button>
                    <button className="icon-action" onClick={() => onView(lead)} aria-label={`Open ${lead.name}`}><Eye size={14} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-only mobile-list">
          {filtered.map((lead) => (
            <div key={lead.id} className="mobile-row">
              <div className="mobile-row-top">
                <button className="person" onClick={() => onView(lead)}><Avatar name={lead.name} size="sm" /><div><strong>{lead.name}</strong><small>{lead.company || lead.source}</small></div></button>
                <Priority value={lead.priority} />
              </div>
              <div className="mobile-row-meta"><Score value={lead.score} /><strong>{money(lead.expectedValue)}</strong></div>
              <div className="mobile-selects">
                <span className="select-inline"><select value={String(lead.stageId)} onChange={(event) => onStage(lead, Number(event.target.value))} aria-label={`Stage for ${lead.name}`}>{data.stages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={12} /></span>
                <span className="select-inline"><select value={String(lead.assignedToId ?? "")} onChange={(event) => onAssign(lead, Number(event.target.value))} aria-label={`Assign ${lead.name}`}><option value="" disabled>Unassigned</option>{teamOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={12} /></span>
              </div>
              <div className="mobile-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => onAction(lead, "call")}><Phone size={13} /> Call</button>
                <button className="btn btn-secondary btn-sm" onClick={() => onAction(lead, "whatsapp")}><MessageCircle size={13} /> WhatsApp</button>
                <button className="btn btn-primary btn-sm" onClick={() => onView(lead)}>Open</button>
              </div>
            </div>
          ))}
        </div>
        {!filtered.length && <Empty title="No leads found" detail="Clear a filter or add a new lead." />}
        <div className="table-foot"><span>{filtered.length} leads shown</span><span>Sorted by {sort === "score" ? "lead score" : sort === "value" ? "value" : "date"}</span></div>
      </Card>
    </div>
  );
}

/* ----------------------------------- deals ---------------------------------- */

function DealCard({ deal, stages, onOpen, onStage, onDragStart, onDragEnd, dragging }: {
  deal: DealView;
  stages: StageView[];
  onOpen: () => void;
  onStage: (stageId: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  return (
    <article
      className={`deal-card ${dragging ? "dragging" : ""}`}
      draggable
      onDragStart={(event) => { event.dataTransfer.setData("text/plain", String(deal.id)); event.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
    >
      <div className="deal-top"><Priority value={deal.priority} /><button className="drag-handle" aria-label="Drag deal"><LayoutGrid size={13} /></button></div>
      <button className="deal-title" onClick={onOpen}>{deal.title}</button>
      <p className="deal-company"><Building2 size={12} />{deal.company || deal.contact}</p>
      {deal.maidName && <p className="deal-company"><Users size={12} />Maid: {deal.maidName}</p>}
      {deal.schedule && <p className="deal-company"><CalendarDays size={12} />{deal.schedule}</p>}
      <div className="deal-value">{money(deal.value, false)}</div>
      <div className="deal-meta"><span><CalendarDays size={12} /> {shortDate(deal.startAt || deal.expectedCloseAt)}</span><span>{deal.placementStatus || `${deal.probability}% likely`}</span></div>
      <div className="deal-foot">
        <span className="person-mini"><Avatar name={deal.owner} size="xs" />{deal.owner.split(" ")[0]}</span>
        <span className="select-inline compact">
          <select value={String(deal.stageId)} onChange={(event) => onStage(Number(event.target.value))} aria-label={`Move ${deal.title}`}>
            {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
          </select><ChevronDown size={11} />
        </span>
      </div>
    </article>
  );
}

export function DealsView({ data, onAdd, onOpen, onStage }: {
  data: WorkspaceData;
  onAdd: () => void;
  onOpen: (deal: DealView) => void;
  onStage: (deal: DealView, stageId: number) => void;
}) {
  const [mode, setMode] = useState<"board" | "list">("board");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<number | null>(null);
  const total = data.deals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = data.deals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0);
  const closing = data.deals.filter((deal) => new Date(deal.expectedCloseAt).getMonth() === new Date().getMonth()).length;

  const drop = (stageId: number) => {
    const deal = data.deals.find((item) => item.id === draggingId);
    setDraggingId(null);
    setDragOverStage(null);
    if (deal && deal.stageId !== stageId) onStage(deal, stageId);
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={data.organization.slug === "homigo" ? "PLACEMENT MANAGEMENT" : "DEAL MANAGEMENT"}
        title={data.profile.dealPlural || "Trip Bookings"}
        subtitle={data.organization.slug === "homigo" ? "Track which maid is assigned to each client, plus start dates, salary and placement fee" : "Drag deals between stages, or update the stage from each card"}
        actions={<>
          <div className="view-switch"><button className={mode === "board" ? "active" : ""} onClick={() => setMode("board")}><LayoutGrid size={14} /> Board</button><button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}><List size={14} /> List</button></div>
          <button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> {data.organization.slug === "homigo" ? "New service booking" : "New deal"}</button>
        </>}
      />

      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon yellow"><CircleDollarSign size={16} /></span><div><small>{data.organization.slug === "homigo" ? "Placement value" : "Pipeline value"}</small><strong>{money(total)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon mint"><TrendingUp size={16} /></span><div><small>{data.organization.slug === "homigo" ? "Weighted placement forecast" : "Weighted forecast"}</small><strong>{money(weighted)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><Handshake size={16} /></span><div><small>{data.profile.dealPlural || "Open deals"}</small><strong>{data.deals.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><CalendarDays size={16} /></span><div><small>{data.organization.slug === "homigo" ? "Starting this month" : "Closing this month"}</small><strong>{closing}</strong></div></div>
      </section>

      {mode === "board" ? (
        <div className="board-scroll">
          {data.stages.map((stage) => {
            const deals = data.deals.filter((deal) => deal.stageId === stage.id);
            return (
              <section
                key={stage.id}
                className={`deal-col ${dragOverStage === stage.id ? "drop-active" : ""}`}
                onDragOver={(event) => { event.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage((current) => current === stage.id ? null : current)}
                onDrop={(event) => { event.preventDefault(); drop(stage.id); }}
              >
                <header className="col-head">
                  <div><span className="col-dot" style={{ background: stage.color }} /><h2>{stage.name}</h2><b>{deals.length}</b></div>
                  <span className="col-sum">{money(deals.reduce((sum, deal) => sum + deal.value, 0))}</span>
                </header>
                <div className="deal-list">
                  {deals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      stages={data.stages}
                      onOpen={() => onOpen(deal)}
                      onStage={(stageId) => onStage(deal, stageId)}
                      onDragStart={() => setDraggingId(deal.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                      dragging={draggingId === deal.id}
                    />
                  ))}
                  <button className="add-deal" onClick={onAdd}><Plus size={13} /> {data.organization.slug === "homigo" ? "Add placement" : "Add deal"}</button>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Card pad={false}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>{data.profile.dealLabel || "Deal"}</th><th>Stage</th><th>{data.organization.slug === "homigo" ? "Client / property" : "Company"}</th><th>Value</th><th>Probability</th><th>{data.organization.slug === "homigo" ? "Start date" : "Expected close"}</th><th>Owner</th><th>Priority</th></tr></thead>
              <tbody>
                {data.deals.map((deal) => (
                  <tr key={deal.id} className="clickable" onClick={() => onOpen(deal)}>
                    <td><strong>{deal.title}</strong><small className="cell-sub">{deal.contact}</small></td>
                    <td><Status value={deal.stage} /></td>
                    <td className="muted">{deal.company || deal.contact}</td>
                    {data.organization.slug === "homigo" && <td>{deal.maidName || "Not assigned"}</td>}
                    <td className="strong">{money(deal.value, false)}</td>
                    <td>{data.organization.slug === "homigo" ? <Status value={deal.placementStatus || deal.stage} /> : <span className="inline-progress"><span className="progress-track"><i style={{ width: `${deal.probability}%` }} /></span>{deal.probability}%</span>}</td>
                    <td className="muted">{shortDate(deal.startAt || deal.expectedCloseAt)}</td>
                    <td>{deal.owner.split(" ")[0]}</td>
                    <td><Priority value={deal.priority} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <p className="board-hint"><LayoutGrid size={13} /> {data.organization.slug === "homigo" ? "Move placements from shortlist to placed as the maid starts service. Record the agreed fee and start date." : "Tip: drag a deal card onto another stage. On mobile, use the stage selector on each card."}</p>
    </div>
  );
}

/* --------------------------------- pipeline --------------------------------- */

export function PipelineView({ data, onOpen, onSettings }: { data: WorkspaceData; onOpen: (deal: DealView) => void; onSettings: () => void }) {
  const total = data.deals.reduce((sum, deal) => sum + deal.value, 0);
  const weighted = data.deals.reduce((sum, deal) => sum + deal.value * deal.probability / 100, 0);
  const max = Math.max(...data.stages.map((stage) => data.deals.filter((deal) => deal.stageId === stage.id).reduce((sum, deal) => sum + deal.value, 0)), 1);

  return (
    <div className="page">
      <PageHead
        eyebrow={data.organization.slug === "homigo" ? "SERVICE OPERATIONS" : "SALES OPERATIONS"}
        title={data.profile.pipelineName}
        subtitle={`${data.profile.pipelineName} · ${data.stages.length} stages, from first enquiry to confirmed booking`}
        actions={<><button className="btn btn-secondary" onClick={onSettings}><Settings2 size={15} /> Customize stages</button><button className="btn btn-primary" onClick={() => onOpen(data.deals[0])} disabled={!data.deals.length}><Handshake size={15} /> Review deals</button></>}
      />

      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon yellow"><CircleDollarSign size={16} /></span><div><small>Pipeline value</small><strong>{money(total)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon mint"><TrendingUp size={16} /></span><div><small>Weighted forecast</small><strong>{money(weighted)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><Target size={16} /></span><div><small>Avg. probability</small><strong>{Math.round(data.deals.reduce((sum, deal) => sum + deal.probability, 0) / Math.max(data.deals.length, 1))}%</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><Handshake size={16} /></span><div><small>Avg. deal size</small><strong>{money(total / Math.max(data.deals.length, 1))}</strong></div></div>
      </section>

      <div className="grid-main">
        <Card>
          <CardHead title={data.organization.slug === "homigo" ? "Placement progress" : "Pipeline funnel"} subtitle={data.organization.slug === "homigo" ? "Move client requests through each placement step" : "Value and conversion at every stage"} actions={<span className="badge badge-gray">{data.profile.pipelineName}</span>} />
          <div className="funnel">
            {data.stages.map((stage, index) => {
              const deals = data.deals.filter((deal) => deal.stageId === stage.id);
              const value = deals.reduce((sum, deal) => sum + deal.value, 0);
              const previous = index === 0 ? deals.length : data.deals.filter((deal) => deal.stageId === data.stages[index - 1].id).length;
              const rate = index === 0 ? 100 : Math.round(deals.length / Math.max(previous, 1) * 100);
              return (
                <div key={stage.id} className="funnel-row">
                  <div className="funnel-label"><span className="col-dot" style={{ background: stage.color }} /><strong>{stage.name}</strong><small>{deals.length} {data.profile.dealLabel?.toLowerCase() || "deals"}</small></div>
                  <div className="funnel-track"><i style={{ width: `${Math.max(4, value / max * 100)}%`, background: stage.color }} /></div>
                  <div className="funnel-value"><strong>{money(value)}</strong><small>{index === 0 ? "Entry" : `${rate}% step conversion`}</small></div>
                </div>
              );
            })}
          </div>
          <div className="funnel-foot">
            <span><i style={{ background: "#66e3c2" }} /> Won: {data.deals.filter((deal) => data.stages.find((stage) => stage.id === deal.stageId)?.isWon).length} deals</span>
            <span><i style={{ background: "#ff8f8f" }} /> Lost: {data.deals.filter((deal) => data.stages.find((stage) => stage.id === deal.stageId)?.isLost).length} deals</span>
          </div>
        </Card>

        <div className="stack">
          <Card>
            <CardHead title="Stage configuration" subtitle="Shared across the workspace" actions={<button className="icon-action" onClick={onSettings} aria-label="Edit pipeline settings"><Settings2 size={14} /></button>} />
            <div className="stage-config">
              {data.stages.map((stage, index) => (
                <div key={stage.id} className="stage-config-row">
                  <span className="stage-index">{index + 1}</span><span className="col-dot" style={{ background: stage.color }} />
                  <strong>{stage.name}</strong>
                  {stage.isWon && <span className="badge badge-mint">Won</span>}
                  {stage.isLost && <span className="badge badge-coral">Lost</span>}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHead title={data.organization.slug === "homigo" ? "Placements needing attention" : "At-risk deals"} subtitle={data.organization.slug === "homigo" ? "Review delayed shortlists, start dates and follow-ups" : "Low probability or stale close dates"} />
            <div className="risk-list">
              {data.deals.filter((deal) => deal.probability < 45 || new Date(deal.expectedCloseAt) < new Date()).slice(0, 4).map((deal) => (
                <button key={deal.id} className="risk-item" onClick={() => onOpen(deal)}>
                  <span className="risk-dot" /><div><strong>{deal.title}</strong><small>{deal.owner} · {deal.probability}% · {shortDate(deal.expectedCloseAt)}</small></div><b>{money(deal.value)}</b>
                </button>
              ))}
              {!data.deals.filter((deal) => deal.probability < 45 || new Date(deal.expectedCloseAt) < new Date()).length && <p className="muted-note">No at-risk deals. The pipeline looks healthy.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- tasks ----------------------------------- */

export function TasksView({ data, onAdd, onComplete }: { data: WorkspaceData; onAdd: () => void; onComplete: (id: number) => void }) {
  const [tab, setTab] = useState("Open");
  const filtered = data.tasks.filter((task) => tab === "All" || (tab === "Completed" ? task.status === "completed" : task.status !== "completed"));
  const overdue = data.tasks.filter((task) => task.status !== "completed" && new Date(task.dueAt) < new Date()).length;

  return (
    <div className="page">
      <PageHead
        eyebrow="WORK MANAGEMENT"
        title="Tasks & follow-ups"
        subtitle={`${data.tasks.filter((task) => task.status !== "completed").length} open · ${overdue} overdue`}
        actions={<button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> Add task</button>}
      />
      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon yellow"><Clock3 size={16} /></span><div><small>Open</small><strong>{data.tasks.filter((task) => task.status !== "completed").length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><CalendarDays size={16} /></span><div><small>Overdue</small><strong>{overdue}</strong></div></div>
        <div className="summary-card"><span className="summary-icon mint"><Check size={16} /></span><div><small>Completed</small><strong>{data.tasks.filter((task) => task.status === "completed").length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><Users size={16} /></span><div><small>High priority</small><strong>{data.tasks.filter((task) => task.priority === "High" && task.status !== "completed").length}</strong></div></div>
      </section>

      <Card pad={false}>
        <div className="table-toolbar">
          <Tabs tabs={["Open", "Completed", "All"]} value={tab} onChange={setTab} />
          <span className="badge badge-gray">{filtered.length} items</span>
        </div>
        <div className="task-rows">
          {filtered.map((task) => (
            <div key={task.id} className={`task-row ${task.status === "completed" ? "done" : ""}`}>
              <button className="check-btn" onClick={() => task.status !== "completed" && onComplete(task.id)} aria-label={`Complete ${task.title}`}>{task.status === "completed" && <Check size={12} />}</button>
              <div className="task-row-main">
                <p>{task.title}</p>
                <small>{task.relatedTo} · {task.type} · {task.assignee}</small>
              </div>
              <Priority value={task.priority} />
              <div className={`task-due ${task.status !== "completed" && new Date(task.dueAt) < new Date() ? "overdue" : ""}`}><CalendarDays size={13} />{formatDate(task.dueAt, true)}</div>
              {task.status !== "completed" && <button className="btn btn-secondary btn-sm" onClick={() => onComplete(task.id)}><Check size={13} /> Done</button>}
            </div>
          ))}
          {!filtered.length && <Empty title="Nothing here" detail="Try another tab or add a new task." />}
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------- calendar --------------------------------- */

type CalendarEvent = { date: string; kind: "task" | "followup" | "deal"; title: string; sub: string; taskId?: number };

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function CalendarView({ data, onAdd, onComplete }: { data: WorkspaceData; onAdd: () => void; onComplete: (id: number) => void }) {
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selected, setSelected] = useState(() => dayKey(new Date()));

  const events = useMemo<CalendarEvent[]>(() => [
    ...data.tasks.filter((task) => task.status !== "completed").map((task) => ({ date: dayKey(new Date(task.dueAt)), kind: "task" as const, title: task.title, sub: `${task.type} · ${task.assignee}`, taskId: task.id })),
    ...data.leads.filter((lead) => lead.nextFollowUp).map((lead) => ({ date: dayKey(new Date(lead.nextFollowUp!)), kind: "followup" as const, title: `Follow up with ${lead.name}`, sub: `${lead.stage} · ${money(lead.expectedValue)}` })),
    ...data.deals.map((deal) => ({ date: dayKey(new Date(deal.expectedCloseAt)), kind: "deal" as const, title: `Close ${deal.title}`, sub: `${deal.company} · ${money(deal.value)}` })),
  ], [data]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const startWeekday = start.getDay();
    const cells: Array<{ date: Date; current: boolean }> = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), index - startWeekday + 1);
      cells.push({ date, current: date.getMonth() === month.getMonth() });
    }
    return cells;
  }, [month]);

  const moveMonth = (direction: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1));
  const selectedEvents = byDay.get(selected) ?? [];
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(month);

  return (
    <div className="page">
      <PageHead
        eyebrow="SCHEDULE"
        title="Calendar"
        subtitle="Follow-ups, task deadlines and expected deal closes in one view"
        actions={<><button className="btn btn-secondary" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(dayKey(now)); }}>Today</button><button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> Add task</button></>}
      />
      <div className="calendar-layout">
        <Card>
          <div className="cal-toolbar">
            <div className="cal-title"><h2>{monthLabel}</h2><span className="badge badge-gray">{events.filter((event) => event.date.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`)).length} events</span></div>
            <div className="cal-nav"><button className="icon-action" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={15} /></button><button className="icon-action" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={15} /></button></div>
          </div>
          <div className="cal-week">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="cal-grid">
            {days.map(({ date, current }) => {
              const key = dayKey(date);
              const dayEvents = byDay.get(key) ?? [];
              const isToday = key === dayKey(new Date());
              return (
                <button key={key} className={`cal-day ${current ? "" : "other"} ${isToday ? "today" : ""} ${selected === key ? "selected" : ""}`} onClick={() => setSelected(key)}>
                  <span className="cal-number">{date.getDate()}</span>
                  <span className="cal-dots">
                    {dayEvents.slice(0, 3).map((event, index) => <i key={index} className={`cal-dot ${event.kind}`} />)}
                    {dayEvents.length > 3 && <b>+{dayEvents.length - 3}</b>}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="cal-legend"><span><i className="cal-dot task" /> Tasks</span><span><i className="cal-dot followup" /> Follow-ups</span><span><i className="cal-dot deal" /> Deal closes</span></div>
        </Card>

        <Card>
          <CardHead title={new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${selected}T12:00:00`))} subtitle={`${selectedEvents.length} scheduled items`} />
          <div className="agenda">
            {selectedEvents.map((event, index) => (
              <div key={`${event.title}-${index}`} className="agenda-item">
                <span className={`agenda-icon ${event.kind}`}><CalendarDays size={14} /></span>
                <div><strong>{event.title}</strong><small>{event.sub}</small></div>
                {event.taskId && <button className="icon-action" onClick={() => onComplete(event.taskId!)} aria-label="Complete task"><Check size={14} /></button>}
              </div>
            ))}
            {!selectedEvents.length && <p className="muted-note">Nothing scheduled. A good day to get ahead.</p>}
          </div>
          <div className="agenda-upcoming">
            <p className="eyebrow">COMING UP</p>
            {events.filter((event) => event.date > selected).slice(0, 4).map((event, index) => (
              <div key={`${event.title}-next-${index}`} className="upcoming-row"><span>{shortDate(`${event.date}T12:00:00`)}</span><div><strong>{event.title}</strong><small>{event.sub}</small></div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* --------------------------------- reports ---------------------------------- */

export function ReportsView({ data, onToast }: { data: WorkspaceData; onToast: (message: string) => void }) {
  const [range, setRange] = useState("This month");
  const collected = data.payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const won = data.deals.filter((deal) => data.stages.find((stage) => stage.id === deal.stageId)?.isWon).length;
  const factor = range === "This week" ? 0.35 : range === "This quarter" ? 2.6 : 1;
  const maxStage = Math.max(...data.stages.map((stage) => data.leads.filter((lead) => lead.stageId === stage.id).length), 1);
  const team = [...data.team].filter((member) => member.role.toLowerCase() !== "owner");
  const maxRevenue = Math.max(...team.map((member) => member.revenue), 1);

  return (
    <div className="page">
      <PageHead
        eyebrow="BUSINESS INTELLIGENCE"
        title="Reports & insights"
        subtitle="Automatic visibility from the work your team already does"
        actions={<>
          <SelectField ariaLabel="Report range" value={range} onChange={setRange} options={["This week", "This month", "This quarter"].map((value) => ({ value, label: value }))} />
          <button className="btn btn-primary" onClick={() => { downloadCsv("crm-report.csv", [["Metric", "Value"], ["Contacts", data.customers.length], ["Leads", data.leads.length], ["Open deals", data.deals.length], ["Revenue collected", collected], ["Conversion", `${Math.round(won / Math.max(data.deals.length, 1) * 100)}%`]]); onToast("Report exported as CSV"); }}><Download size={15} /> Export report</button>
        </>}
      />

      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon yellow"><CircleDollarSign size={16} /></span><div><small>Revenue · {range.toLowerCase()}</small><strong>{money(collected * factor)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon mint"><Handshake size={16} /></span><div><small>Deals won</small><strong>{won}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><Target size={16} /></span><div><small>Conversion rate</small><strong>{Math.round(won / Math.max(data.deals.length, 1) * 100)}%</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><TrendingUp size={16} /></span><div><small>Avg. deal size</small><strong>{money(data.deals.reduce((sum, deal) => sum + deal.value, 0) / Math.max(data.deals.length, 1))}</strong></div></div>
      </section>

      <section className="grid-main">
        <RevenueChart data={data} />
        <Card>
          <CardHead title="Enquiry sources" subtitle="Where traveller enquiries come from" />
          <SourceDonut data={data} compact />
          <div className="insight-list">
            {data.profile.insights.map((insight, index) => (
              <div key={insight.title} className={`insight ${insight.tone}`}><span>0{index + 1}</span><div><strong>{insight.title}</strong><small>{insight.detail}</small></div></div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid-main">
        <Card>
          <CardHead title="Conversion funnel" subtitle={`${data.profile.leadLabel} progression by stage`} actions={<span className="badge badge-gray">{data.leads.length} leads</span>} />
          <div className="funnel compact">
            {data.stages.map((stage, index) => {
              const leads = data.leads.filter((lead) => lead.stageId === stage.id).length;
              const previous = index === 0 ? leads : data.leads.filter((lead) => lead.stageId === data.stages[index - 1].id).length;
              return (
                <div key={stage.id} className="funnel-row">
                  <div className="funnel-label"><span className="col-dot" style={{ background: stage.color }} /><strong>{stage.name}</strong></div>
                  <div className="funnel-track"><i style={{ width: `${Math.max(4, leads / maxStage * 100)}%`, background: stage.color }} /></div>
                  <div className="funnel-value"><strong>{leads}</strong><small>{index === 0 ? "Entry" : `${Math.round(leads / Math.max(previous, 1) * 100)}%`}</small></div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHead title="Team performance" subtitle="Attributed revenue and workload" actions={<button className="link" onClick={() => onToast("Team performance exported")}>Export</button>} />
          <div className="team-list report">
            {team.map((member, index) => (
              <div key={member.id} className="team-row">
                <Avatar name={member.name} size="sm" />
                <div className="team-main"><div><strong>{member.name}</strong><span>{member.title}</span></div><div className="progress-track"><i style={{ width: `${Math.max(10, member.revenue / maxRevenue * 100)}%` }} /></div></div>
                <div className="team-side"><b>{money(member.revenue)}</b><small>{member.tasksDone} tasks · {member.leads} leads</small></div>
              </div>
            ))}
          </div>
          <div className="card-divider" />
          <div className="stat-row">
            <div><span>New contacts</span><strong>{data.customers.filter((contact) => contact.segment === "New").length}</strong><small>This period</small></div>
            <div><span>Returning</span><strong>{data.customers.filter((contact) => contact.segment === "VIP").length}</strong><small>VIP contacts</small></div>
            <div><span>Inactive</span><strong>{data.customers.filter((contact) => contact.segment === "Inactive").length}</strong><small>Need re-engagement</small></div>
          </div>
        </Card>
      </section>
    </div>
  );
}

/* --------------------------------- settings --------------------------------- */

export function SettingsView({ data, onToast }: {
  data: WorkspaceData;
  onToast: (message: string) => void;
}) {
  const [tab, setTab] = useState("Workspace");
  const [metaConfig, setMetaConfig] = useState<{ callbackUrl: string; verifyToken: string; credentialsSaved: boolean; appId: string; leadAdsEnabled: boolean; aiEnabled: boolean; aiModel: string } | null>(null);
  const [metaAppId, setMetaAppId] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaError, setMetaError] = useState("");

  useEffect(() => {
    if (tab !== "Integrations") return;
    let active = true;
    setMetaLoading(true);
    fetch("/api/integrations/meta")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load integration status");
        if (active) { setMetaConfig(result); setMetaAppId(result.appId || ""); }
      })
      .catch((error) => { if (active) setMetaError(error instanceof Error ? error.message : "Could not load integration status"); })
      .finally(() => { if (active) setMetaLoading(false); });
    return () => { active = false; };
  }, [tab]);

  const saveMetaCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMetaSaving(true);
    setMetaError("");
    try {
      const response = await fetch("/api/integrations/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: metaAppId, appSecret: metaAppSecret, accessToken: metaAccessToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save Meta credentials");
      setMetaAppSecret("");
      setMetaAccessToken("");
      setMetaConfig((current) => current ? { ...current, credentialsSaved: result.credentialsSaved, leadAdsEnabled: result.leadAdsEnabled, appId: metaAppId } : current);
      onToast("Meta credentials saved securely");
    } catch (error) {
      setMetaError(error instanceof Error ? error.message : "Could not save Meta credentials");
    } finally {
      setMetaSaving(false);
    }
  };

  const copyMetaValue = (value: string) => {
    void navigator.clipboard.writeText(value)
      .then(() => onToast("Copied to clipboard"))
      .catch(() => onToast("Could not copy. Select the text and copy it."));
  };
  const [permissions, setPermissions] = useState<Record<string, boolean>>({ "View all contacts": true, "Manage deals": true, "View revenue": true, "Export reports": false, "Manage team": false });
  const [autos, setAutos] = useState<Record<string, boolean>>({ "Assign new leads automatically": true, "Create first follow-up": true, "Quote follow-up after 2 days": true, "Overdue payment reminders": true, "Inactive customer re-engagement": false });
  const [alerts, setAlerts] = useState<Record<string, boolean>>({ "New lead assigned": true, "Payment overdue": true, "Deal stage changed": true, "Daily task digest": false });

  return (
    <div className="page">
      <PageHead eyebrow="WORKSPACE CONFIGURATION" title="Settings" subtitle={`Configure ${data.organization.name} without changing any code`} actions={<button className="btn btn-primary" onClick={() => onToast("Workspace settings saved")}><Check size={15} /> Save changes</button>} />
      <div className="settings-layout">
        <Card pad={false} className="settings-tabs-card">
          <div className="settings-tabs">
            {["Workspace", "Pipeline & fields", "Team", "Automations", "Notifications", "Integrations"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<ChevronRight size={13} /></button>)}
          </div>
        </Card>
        <div className="stack">
          {tab === "Workspace" && <>
            <Card>
              <CardHead title="Business profile" subtitle="Shown on quotations, invoices and your workspace" actions={<span className="badge badge-yellow">{data.organization.industry}</span>} />
              <div className="form-grid">
                <label className="field"><span className="field-label">Business name</span><input defaultValue={data.organization.name} /></label>
                <label className="field"><span className="field-label">Business type</span><input defaultValue="Private company" /></label>
                <label className="field"><span className="field-label">Country</span><input defaultValue={data.organization.country} /></label>
                <label className="field"><span className="field-label">Currency</span><input defaultValue={data.organization.currency} /></label>
                <label className="field"><span className="field-label">Team size</span><input defaultValue={data.organization.employees} /></label>
                <label className="field"><span className="field-label">Locations</span><input defaultValue={data.organization.locations} /></label>
              </div>
            </Card>
            <Card>
              <CardHead title={data.organization.slug === "homigo" ? "HOMIGO agency workspace" : "Travel & tourism workspace"} subtitle={data.organization.slug === "homigo" ? "Configured for client requirements, maid profiles, schedules and placements" : "Configured for trip enquiries, traveller relationships and bookings"} />
              <div className="industry-switch">
                <div className="industry-switch-item active">
                  <span><Building2 size={16} /></span>
                  <div><strong>{data.organization.name}</strong><small>{data.organization.slug === "homigo" ? "Clients · maid directory · placements · schedules" : "Trips · departures · itineraries · payments"}</small></div>
                  <Check size={15} />
                </div>
              </div>
            </Card>
          </>}
          {tab === "Pipeline & fields" && <>
            <Card>
              <CardHead title={data.profile.pipelineName} subtitle="Reorder, rename or add stages" actions={<button className="btn btn-secondary btn-sm" onClick={() => onToast("Stage builder opened")}><Plus size={13} /> Stage</button>} />
              <div className="stage-config">
                {data.stages.map((stage, index) => (
                  <div key={stage.id} className="stage-config-row"><span className="stage-index">{index + 1}</span><span className="col-dot" style={{ background: stage.color }} /><strong>{stage.name}</strong>{stage.isWon && <span className="badge badge-mint">Won</span>}{stage.isLost && <span className="badge badge-coral">Lost</span>}<Pencil size={13} className="row-edit" /></div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHead title={data.organization.slug === "homigo" ? "Service request fields" : "Custom fields"} subtitle={`${data.profile.leadLabel} fields for ${data.organization.industry.toLowerCase()}`} actions={<button className="btn btn-secondary btn-sm" onClick={() => onToast("Custom field builder opened")}><Plus size={13} /> Field</button>} />
              <div className="custom-fields">
                {(data.profile.leadFields || data.profile.customFields).map((field) => <div key={field.key} className="custom-field"><div><strong>{field.label}</strong><small>Used on {data.profile.leadLabel.toLowerCase()} and contact records</small></div><span className="badge badge-gray">Text</span><Pencil size={13} className="row-edit" /></div>)}
              </div>
            </Card>
          </>}
          {tab === "Team" && <>
            <Card pad={false}>
              <div className="card-pad card-head-border"><CardHead title="Team & roles" subtitle={`${data.team.length} people in this workspace`} actions={<button className="btn btn-primary btn-sm" onClick={() => onToast("Invite member form opened")}><Plus size={14} /> Invite member</button>} /></div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Member</th><th>Role</th><th>Leads</th><th>Tasks done</th><th>Revenue</th><th>Status</th></tr></thead>
                  <tbody>{data.team.map((member) => <tr key={member.id}><td><div className="person"><Avatar name={member.name} size="sm" /><div><strong>{member.name}</strong><small>{member.title}</small></div></div></td><td><span className="badge badge-gray">{member.role}</span></td><td>{member.leads}</td><td>{member.tasksDone}</td><td className="strong">{money(member.revenue)}</td><td><Status value="Active" /></td></tr>)}</tbody>
                </table>
              </div>
            </Card>
            <Card>
              <CardHead title="Role permissions" subtitle="Applied to the employee experience" />
              <div className="setting-rows">{Object.entries(permissions).map(([label, value]) => <div key={label} className="setting-row"><div><strong>{label}</strong><small>{value ? "Allowed for employees" : "Restricted to owners"}</small></div><Toggle label={label} checked={value} onChange={(next) => setPermissions((current) => ({ ...current, [label]: next }))} /></div>)}</div>
            </Card>
          </>}
          {tab === "Automations" && <Card>
            <CardHead title="Automation rules" subtitle="What the system does so your team doesn’t have to remember" actions={<span className="badge badge-mint"><i className="dot" />{Object.values(autos).filter(Boolean).length} active</span>} />
            <div className="setting-rows">{Object.entries(autos).map(([label, value]) => <div key={label} className="setting-row"><div><strong>{label}</strong><small>{label === "Assign new leads automatically" ? "Round-robin assignment from your active team" : label === "Create first follow-up" ? "A follow-up is scheduled within 24 hours" : label === "Quote follow-up after 2 days" ? "Never let a proposal go cold" : label === "Overdue payment reminders" ? "Notify the deal owner when a payment passes its due date" : "Create a follow-up after 60 days of silence"}</small></div><Toggle label={label} checked={value} onChange={(next) => setAutos((current) => ({ ...current, [label]: next }))} /></div>)}</div>
          </Card>}
          {tab === "Integrations" && <>
            <Card>
              <CardHead title="Meta inbox & lead integrations" subtitle="Receive WhatsApp messages, Instagram DMs and Facebook Lead Ads directly in your CRM" actions={<span className={`badge ${metaConfig?.credentialsSaved ? "badge-mint" : "badge-yellow"}`}>{metaConfig?.credentialsSaved ? "Meta app saved" : "Setup required"}</span>} />
              {metaLoading && <p className="muted-note">Checking integration settings…</p>}
              {metaConfig && <>
                <div className="setting-row">
                  <div><strong>Meta webhook callback URL</strong><small>Paste this into your Meta Developer App webhook settings</small><code>{metaConfig.callbackUrl}</code></div>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => copyMetaValue(metaConfig.callbackUrl)}>Copy URL</button>
                </div>
                <div className="setting-row">
                  <div><strong>Webhook verify token</strong><small>Use the exact token below when Meta asks for a Verify Token</small><code>{metaConfig.verifyToken || "Not configured"}</code></div>
                  <button className="btn btn-secondary btn-sm" type="button" disabled={!metaConfig.verifyToken} onClick={() => copyMetaValue(metaConfig.verifyToken)}>Copy token</button>
                </div>
                <div className="setting-row">
                  <div><strong>WhatsApp & Instagram inbound messages</strong><small>{metaConfig.credentialsSaved ? "App signature credentials saved — subscribe the webhook fields in Meta." : "Save your Meta App ID and App Secret below to enable signed webhook events."}</small></div>
                  <span className="badge badge-gray">{metaConfig.credentialsSaved ? "Ready for subscription" : "Not connected"}</span>
                </div>
                <div className="setting-row">
                  <div><strong>Facebook Lead Ads</strong><small>{metaConfig.leadAdsEnabled ? "Page access token saved; form details can be retrieved from leadgen events." : "Optional: add a Page Access Token to import form answers from Lead Ads."}</small></div>
                  <span className="badge badge-gray">{metaConfig.leadAdsEnabled ? "Token saved" : "Optional setup"}</span>
                </div>
                <div className="setting-row">
                  <div><strong>AI lead qualification</strong><small>Summarise messages, identify destinations and dates, prioritise enquiries, and suggest a reply.</small></div>
                  <span className="badge badge-mint">{metaConfig.aiEnabled ? "AI available" : "AI credentials missing"}</span>
                </div>
              </>}
            </Card>
            <Card>
              <CardHead title="Connect your Meta app" subtitle="Credentials are encrypted before storage and are never shown again after saving." />
              <form className="form-grid" onSubmit={saveMetaCredentials}>
                <label className="field"><span className="field-label">Meta App ID</span><input value={metaAppId} onChange={(event) => setMetaAppId(event.target.value)} inputMode="numeric" placeholder="Your Meta App ID" required /></label>
                <label className="field"><span className="field-label">Meta App Secret</span><input value={metaAppSecret} onChange={(event) => setMetaAppSecret(event.target.value)} type="password" autoComplete="new-password" placeholder={metaConfig?.credentialsSaved ? "Saved — leave blank to keep current secret" : "Paste your App Secret"} required={!metaConfig?.credentialsSaved} /></label>
                <label className="field"><span className="field-label">Page Access Token (optional)</span><input value={metaAccessToken} onChange={(event) => setMetaAccessToken(event.target.value)} type="password" autoComplete="new-password" placeholder={metaConfig?.leadAdsEnabled ? "Saved — leave blank to keep current token" : "Needed for Facebook Lead Ads form retrieval"} /></label>
                {metaError && <p className="login-error" role="alert">{metaError}</p>}
                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={metaSaving || !metaAppId.trim() || (!metaAppSecret.trim() && !metaAccessToken.trim())}>
                    {metaSaving ? <span className="spinner" /> : <Check size={15} />} Save Meta credentials
                  </button>
                </div>
              </form>
            </Card>
            <Card>
              <CardHead title="Meta setup checklist" subtitle="These one-time subscriptions are completed in Meta for Developers, not inside this CRM." />
              <ol className="integration-steps">
                <li>Create or open your Meta app at <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer">Meta for Developers</a>, then copy its App ID and App Secret into the form above.</li>
                <li>Add WhatsApp Cloud API and Instagram Messaging to the app. Connect your WhatsApp Business Account and Instagram professional account.</li>
                <li>In Webhooks, set the callback URL and Verify Token shown above. Subscribe to WhatsApp <code>messages</code> and Instagram <code>messages</code> events.</li>
                <li>Subscribe your WhatsApp Business Account and Instagram account to the app's webhook and grant the messaging permissions required by your Meta app/account setup.</li>
                <li>For Facebook Lead Ads, add a Page Access Token above, subscribe the Page to the <code>leadgen</code> field, and grant Page lead access permissions.</li>
              </ol>
              <p className="muted-note">Once Meta verifies this callback and webhook subscriptions are active, incoming messages and lead-form submissions create or update CRM enquiries automatically. This CRM captures inbound messages; it does not send outbound replies.</p>
            </Card>
          </>}
          {tab === "Notifications" && <Card>
            <CardHead title="Action-based notifications" subtitle="Only the updates that need a response" />
            <div className="setting-rows">{Object.entries(alerts).map(([label, value]) => <div key={label} className="setting-row"><div><strong>{label}</strong><small>{label === "Daily task digest" ? "A single morning summary instead of individual alerts" : "Sent to the assigned owner"}</small></div><Toggle label={label} checked={value} onChange={(next) => setAlerts((current) => ({ ...current, [label]: next }))} /></div>)}</div>
          </Card>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ quotations/payments ------------------------- */

export function QuotationsView({ data, onToast }: { data: WorkspaceData; onToast: (message: string) => void }) {
  return (
    <div className="page">
      <PageHead eyebrow="FINANCE" title={data.organization.slug === "homigo" ? "Service Agreements" : "Quotations"} subtitle={data.organization.slug === "homigo" ? `${data.quotations.length} client service agreements to prepare and track` : `${data.quotations.length} proposals ready to send and track`} actions={<button className="btn btn-primary" onClick={() => onToast("Agreement builder opened")}><Plus size={16} /> {data.organization.slug === "homigo" ? "New agreement" : "New quotation"}</button>} />
      <section className="quote-grid">
        {data.quotations.map((quote) => (
          <Card key={quote.id}>
            <div className="quote-top"><span className="summary-icon yellow"><FileText size={17} /></span><Status value={quote.status} /></div>
            <small className="quote-number">{quote.quoteNumber}</small>
            <h3 className="quote-title">{quote.title}</h3>
            <p className="quote-customer">{quote.customer}</p>
            <div className="quote-amount"><span>Total value</span><strong>{money(quote.amount + quote.tax, false)}</strong><small>Incl. {money(quote.tax, false)} tax</small></div>
            <div className="quote-foot"><span>Valid until {shortDate(quote.validUntil)}</span><div>
              <button className="icon-action" onClick={() => onToast(`${quote.quoteNumber} downloaded as PDF`)} aria-label="Download"><Download size={14} /></button>
              <button className="icon-action whatsapp" onClick={() => onToast(`Share link copied for ${quote.quoteNumber}`)} aria-label="Share"><Share2 size={14} /></button>
              <button className="icon-action" onClick={() => onToast(`${quote.quoteNumber} opened`)} aria-label="Open"><ExternalLink size={14} /></button>
            </div></div>
          </Card>
        ))}
      </section>
    </div>
  );
}

export function PaymentsView({ data, onCollect }: { data: WorkspaceData; onCollect: (id: number) => void }) {
  const total = data.payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const paid = data.payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const overdue = data.payments.filter((payment) => payment.status === "Overdue").reduce((sum, payment) => sum + payment.totalAmount - payment.paidAmount, 0);

  return (
    <div className="page">
      <PageHead eyebrow="FINANCE" title="Payments" subtitle="Collections, outstanding balances and overdue reminders" actions={<button className="btn btn-primary" onClick={() => onCollect(data.payments.find((payment) => payment.status !== "Paid")?.id ?? 0)}><CircleDollarSign size={16} /> Record payment</button>} />
      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon yellow"><ReceiptText size={16} /></span><div><small>Total billed</small><strong>{money(total)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon mint"><Check size={16} /></span><div><small>Collected</small><strong>{money(paid)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><Clock3 size={16} /></span><div><small>Outstanding</small><strong>{money(total - paid)}</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><CircleDollarSign size={16} /></span><div><small>Overdue</small><strong>{money(overdue)}</strong></div></div>
      </section>
      <Card pad={false}>
        <div className="table-toolbar"><h2 className="card-title">Payment records</h2><ExportButton onClick={() => downloadCsv("payments.csv", [["Reference", "Contact", "Description", "Total", "Paid", "Due", "Status"], ...data.payments.map((payment) => [payment.reference, payment.customer, payment.description, payment.totalAmount, payment.paidAmount, payment.dueAt, payment.status])])} /></div>
        <div className="payment-list">
          {data.payments.map((payment) => {
            const balance = payment.totalAmount - payment.paidAmount;
            const progress = Math.round(payment.paidAmount / payment.totalAmount * 100);
            return (
              <div key={payment.id} className="payment-row">
                <span className="summary-icon lilac"><Wallet size={16} /></span>
                <div className="payment-main"><div><strong>{payment.customer}</strong><Status value={payment.status} /></div><small>{payment.reference} · {payment.description}</small><span className="inline-progress"><span className="progress-track"><i style={{ width: `${progress}%` }} /></span>{progress}%</span></div>
                <div className="payment-amount"><strong>{money(balance, false)}</strong><small>Due {shortDate(payment.dueAt)}</small></div>
                {payment.status !== "Paid" && <button className="btn btn-secondary btn-sm" onClick={() => onCollect(payment.id)}>Collect</button>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------------- more ----------------------------------- */

const moduleIcons: Record<string, typeof ShieldCheck> = { shield: ShieldCheck, refresh: RefreshCw, file: FileText, wallet: Wallet, building: Building2, calendar: CalendarDays, key: KeyRound, grid: LayoutGrid, package: Package, boxes: Boxes, bag: ReceiptText, truck: Truck };

export function MoreView({ data, onNavigate, onToast }: { data: WorkspaceData; onNavigate: (view: string) => void; onToast: (message: string) => void }) {
  const items = [
    { label: data.profile.customerPlural, view: "contacts", icon: Users, sub: data.customers.length + " customer records" },
    ...(data.organization.slug === "homigo"
      ? [{ label: "Staff Directory", view: "maids", icon: ShieldCheck, sub: data.maids.length + " staff profiles" }]
      : [{ label: "Travel Partners", view: "companies", icon: Building2, sub: data.companies.length + " partner records" }]),
    { label: data.profile.leadPlural, view: "leads", icon: Target, sub: data.leads.length + " enquiries" },
    { label: data.profile.dealPlural || "Deals", view: "deals", icon: Handshake, sub: data.deals.length + " active records" },
    { label: data.profile.pipelineName, view: "pipeline", icon: TrendingUp, sub: "Stages and follow-ups" },
    { label: "Calendar", view: "calendar", icon: CalendarDays, sub: "Schedule & closes" },
    { label: data.organization.slug === "homigo" ? "Service Agreements" : "Quotations", view: "quotations", icon: FileText, sub: data.quotations.length + " records" },
    { label: "Payments", view: "payments", icon: Wallet, sub: "Collections & dues" },
    { label: "Reports", view: "reports", icon: BarChart3, sub: "Insights & performance" },
    { label: "Settings", view: "settings", icon: Settings2, sub: "Workspace configuration" },
  ];
  return (
    <div className="page">
      <PageHead eyebrow="MORE" title="Tools & modules" subtitle={"Everything in " + data.organization.name} actions={<button className="btn btn-secondary" onClick={() => onToast("Business assistant opened")}><Sparkles size={15} /> Assistant</button>} />
      <section><p className="eyebrow">WORKSPACE</p><div className="more-grid">
        {items.map((item) => <button key={item.view} className="more-card" onClick={() => onNavigate(item.view)}><span className="summary-icon yellow"><item.icon size={17} /></span><div><strong>{item.label}</strong><small>{item.sub}</small></div><ChevronRight size={15} /></button>)}
      </div></section>
      <section><p className="eyebrow">{data.organization.industry.toUpperCase()} MODULES</p><div className="more-grid">
        {data.profile.modules.map((module) => {
          const Icon = moduleIcons[module.icon] ?? Package;
          return <button key={module.label} className="more-card" onClick={() => onToast(module.label + " module opened")}><span className="summary-icon lilac"><Icon size={17} /></span><div><strong>{module.label}</strong><small>{data.organization.industry} workflow</small></div><ChevronRight size={15} /></button>;
        })}
      </div></section>
      <Card><div className="more-footer"><div><strong>{data.organization.name} CRM</strong><small>One simple system to run your business · v1.0</small></div><span className="badge badge-gray">{data.organization.name}</span></div></Card>
    </div>
  );
}
