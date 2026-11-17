"use client";

import {
  Avatar, Card, CardHead, PageHead, Priority, Score, Status, formatDate, money, shortDate,
} from "@/components/ui";
import type { ActivityView, LeadView, WorkspaceData } from "@/lib/crm-types";
import {
  ArrowRight, ArrowUpRight, Building2, CalendarDays, Check, ChevronRight, CircleDollarSign,
  Clock3, Handshake, LayoutGrid, MessageCircle, Phone, Plus, Sparkles, Target, TrendingUp, Users, Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

const revenueRanges = ["7D", "30D", "90D"] as const;
type RevenueRange = (typeof revenueRanges)[number];

const growthFactors = [0.82, 1.06, 0.94, 1.18, 1.02, 1.34, 1.12, 1.42, 1.28, 1.56, 1.38, 1.68];

function seriesFor(data: WorkspaceData, range: RevenueRange) {
  const base = data.profile.chart;
  if (range === "7D") return base.map((point) => point.label);
  if (range === "30D") return ["W1", "W2", "W3", "W4"].flatMap((week) => [`${week} A`, `${week} B`, `${week} C`]);
  return ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
}

function valuesFor(data: WorkspaceData, range: RevenueRange) {
  const base = data.profile.chart.map((point) => point.value);
  const average = base.length ? base.reduce((sum, value) => sum + value, 0) / base.length : 0;
  if (range === "7D") return base;
  if (range === "30D") return growthFactors.map((factor) => Math.round(average * factor * 1.35));
  return growthFactors.map((factor) => Math.round(average * factor * 4.2));
}

export function RevenueChart({ data }: { data: WorkspaceData }) {
  const [range, setRange] = useState<RevenueRange>("7D");
  const labels = seriesFor(data, range);
  const values = valuesFor(data, range);
  const max = Math.max(...values, 1) * 1.12;
  const width = 780;
  const height = 250;
  const left = 50;
  const bottom = 205;
  const usableWidth = width - left - 12;
  const usableHeight = 160;
  const coords = values.map((value, index) => ({
    x: left + (index / (values.length - 1)) * usableWidth,
    y: bottom - (value / max) * usableHeight,
    value,
    label: labels[index],
  }));
  const line = coords.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const target = coords.map((point) => ({ x: point.x, y: bottom - (point.value * 0.7 / max) * usableHeight }));
  const targetLine = target.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1].x} ${bottom} L ${left} ${bottom} Z`;
  const total = values.reduce((sum, value) => sum + value, 0);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({ y: bottom - ratio * usableHeight, value: Math.round(max * ratio) }));

  return (
    <Card className="chart-card">
      <CardHead
        title="Revenue analytics"
        subtitle="Collected revenue against target"
        actions={<div className="range-tabs">{revenueRanges.map((item) => <button key={item} onClick={() => setRange(item)} className={range === item ? "active" : ""}>{item}</button>)}</div>}
      />
      <div className="chart-summary">
        <strong>{money(total)}</strong>
        <small>Recorded revenue in this workspace</small>
      </div>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="Revenue analytics chart">
          <defs>
            <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fad85d" stopOpacity=".22" />
              <stop offset="1" stopColor="#fad85d" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((tick) => (
            <g key={tick.y}>
              <line x1={left} x2={width - 12} y1={tick.y} y2={tick.y} stroke="#2e312f" strokeDasharray="4 6" />
              <text x={left - 10} y={tick.y + 3} textAnchor="end" className="chart-axis">{money(tick.value)}</text>
            </g>
          ))}
          <path d={area} fill="url(#revenue-fill)" />
          <path d={targetLine} fill="none" stroke="#66e3c2" strokeWidth="1.6" strokeDasharray="5 6" opacity=".85" />
          <path d={line} fill="none" stroke="#fad85d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map((point) => (
            <g key={point.label} className="chart-point">
              <circle cx={point.x} cy={point.y} r="3.4" fill="#161717" stroke="#fad85d" strokeWidth="2" />
              <title>{`${point.label}: ${money(point.value, false)}`}</title>
            </g>
          ))}
        </svg>
        <div className="chart-x-labels">{coords.map((point, index) => <span key={`${point.label}-${index}`}>{range === "7D" ? point.label : index % 3 === 0 ? point.label : ""}</span>)}</div>
      </div>
      <div className="chart-legend">
        <span><i style={{ background: "#fad85d" }} /> Collected revenue</span>
        <span><i style={{ background: "#66e3c2" }} /> Target</span>
      </div>
    </Card>
  );
}

const sourceColors = ["#fad85d", "#66e3c2", "#d8a6ff", "#ffb37a", "#8ab4ff", "#8a938c"];

export function SourceDonut({ data, compact = false }: { data: WorkspaceData; compact?: boolean }) {
  const counts = data.profile.sources.map((source) => ({
    source,
    count: data.leads.filter((lead) => lead.source === source).length,
  })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  const top = counts.slice(0, 5);
  const total = top.reduce((sum, item) => sum + item.count, 0) || 1;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const arcs = top.map((item, index) => {
    const length = (item.count / total) * circumference;
    const offset = 25 + top.slice(0, index).reduce((sum, previous) => sum + (previous.count / total) * circumference, 0);
    return { item, index, length, offset };
  });

  return (
    <div className={`donut-wrap ${compact ? "compact" : ""}`}>
      <div className="donut">
        <svg viewBox="0 0 160 160" role="img" aria-label={`${data.profile.leadPlural} by source`}>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#2b2d2c" strokeWidth="19" />
          {arcs.map(({ item, index, length, offset }) => (
            <circle
              key={item.source}
              cx="80" cy="80" r={radius} fill="none"
              stroke={sourceColors[index]}
              strokeWidth="19"
              strokeDasharray={`${Math.max(length - 3, 0)} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            >
              <title>{`${item.source}: ${item.count}`}</title>
            </circle>
          ))}
        </svg>
        <div className="donut-center"><strong>{data.leads.length}</strong><span>{data.profile.leadPlural}</span></div>
      </div>
      <div className="donut-legend">
        {top.map((item, index) => (
          <div key={item.source}><span><i style={{ background: sourceColors[index] }} />{item.source}</span><b>{Math.round(item.count / total * 100)}%</b></div>
        ))}
      </div>
    </div>
  );
}

function SalesBars({ data }: { data: WorkspaceData }) {
  const points = data.profile.chart;
  const max = Math.max(...points.map((point) => point.value), 1);
  const colors = ["#fad85d", "#66e3c2", "#d8a6ff", "#ffb37a", "#fad85d", "#8ab4ff", "#66e3c2"];
  return (
    <div className="bars">
      {points.map((point, index) => (
        <div className="bar-col" key={point.label} title={`${point.label}: ${money(point.value, false)}`}>
          <span className="bar-value">{money(point.value, true)}</span>
          <span className="bar-track"><i className="bar" style={{ height: `${Math.max(12, point.value / max * 100)}%`, background: colors[index % colors.length] }} /></span>
          <span className="bar-label">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

const activityIcons: Record<string, typeof Phone> = {
  call: Phone, message: MessageCircle, whatsapp: MessageCircle, quote: Handshake, payment: Wallet,
  complete: Check, stage: TrendingUp, deal: Handshake, lead: Target, contact: Users, assignment: Users, note: LayoutGrid,
};

function ActivityRow({ activity, index }: { activity: ActivityView; index: number }) {
  const Icon = activityIcons[activity.type] ?? LayoutGrid;
  return (
    <div className="activity-row">
      <span className={`activity-icon tone-${(index % 4) + 1}`}><Icon size={14} /></span>
      <div className="activity-text">
        <p>{activity.title}</p>
        <small>{activity.actor} · {activity.detail}</small>
      </div>
      <time>{shortDate(activity.createdAt)}</time>
    </div>
  );
}

export function OwnerDashboard({ data, onNavigate, onAssistant, onAddContact, onOpenLead, onOpenContact, onCompleteTask }: {
  data: WorkspaceData;
  onNavigate: (view: string) => void;
  onAssistant: () => void;
  onAddContact: () => void;
  onOpenLead: (lead: LeadView) => void;
  onOpenContact: (id: number) => void;
  onCompleteTask: (id: number) => void;
}) {
  const totalBilled = data.payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const collected = data.payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const pending = data.payments.reduce((sum, payment) => sum + Math.max(0, payment.totalAmount - payment.paidAmount), 0);
  const wonLeads = data.leads.filter((lead) => data.stages.find((stage) => stage.id === lead.stageId)?.isWon).length;
  const conversion = Math.round((wonLeads / Math.max(data.leads.length, 1)) * 100);
  const openTasks = data.tasks.filter((task) => task.status !== "completed").slice(0, 4);
  const hotLeads = [...data.leads].filter((lead) => lead.score >= 70).sort((a, b) => b.score - a.score);
  const team = [...data.team].filter((member) => member.role.toLowerCase() !== "owner").sort((a, b) => b.revenue - a.revenue);
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());

  const kpis = useMemo(() => [
    { label: data.profile.customerPlural, value: String(data.customers.length), detail: data.organization.slug === "homigo" ? "Active client accounts" : "Saved traveller records", icon: Users, tone: "mint", foot: data.organization.slug === "homigo" ? "Client database" : `${data.companies.length} companies`, onClick: () => onNavigate("contacts") },
    { label: data.profile.leadPlural, value: String(data.leads.length), detail: `${data.leads.filter((lead) => lead.score >= 75).length} high-priority enquiries`, icon: Target, tone: "yellow", foot: `${data.leads.filter((lead) => !lead.assignedToId).length} unassigned`, onClick: () => onNavigate("leads") },
    { label: data.profile.dealPlural || "Deals", value: String(data.deals.length), detail: money(data.deals.reduce((sum, deal) => sum + deal.value, 0)), icon: Handshake, tone: "lilac", foot: data.organization.slug === "homigo" ? "Confirmed placements" : `${data.deals.filter((deal) => deal.probability >= 70).length} likely to close`, onClick: () => onNavigate("deals") },
    { label: "Payments collected", value: money(collected), detail: `${money(totalBilled)} billed · ${data.payments.length} invoices`, icon: CircleDollarSign, tone: "dark", foot: `${money(pending)} outstanding`, onClick: () => onNavigate("payments") },
    data.organization.slug === "homigo"
      ? { label: "Staff records", value: String(data.maids.length), detail: `${data.maids.filter((maid) => maid.availability.toLowerCase().includes("available") && !maid.availability.toLowerCase().includes("not available")).length} marked available`, icon: Users, tone: "dark", foot: "Staff directory", onClick: () => onNavigate("maids") }
      : { label: "Conversion rate", value: `${conversion}%`, detail: `${wonLeads} won of ${data.leads.length}`, icon: TrendingUp, tone: "dark", foot: "Based on recorded enquiries", onClick: () => onNavigate("reports") },
  ], [collected, conversion, data, onNavigate, pending, totalBilled, wonLeads]);

  return (
    <div className="page">
      <PageHead
        eyebrow={`${data.organization.industry.toUpperCase()} WORKSPACE`}
        title={`Hello, ${data.currentUser.name.split(" ")[0]} 👋`}
        subtitle={`Here’s what’s happening at ${data.organization.name} today.`}
        actions={<>
          <span className="date-pill"><CalendarDays size={14} /> {today}</span>
          <button className="btn btn-secondary btn-sm" onClick={onAssistant}><Sparkles size={14} /> Assistant</button>
          <button className="btn btn-primary btn-sm" onClick={onAddContact}><Plus size={15} /> {data.profile.customerLabel === "Client" ? "Add client" : "Add contact"}</button>
        </>}
      />

      <div className="attention-strip">
        <div className="attention-title"><span className="pulse-dot" /> Needs your attention</div>
        <div className="attention-items">
          {data.profile.attention.slice(0, 3).map((item) => (
            <button key={item.title} onClick={() => onNavigate(item.title.includes("payment") ? "payments" : "leads")} className={`attention-item ${item.severity}`}>
              <b>{item.count}</b><span>{item.title}</span><ChevronRight size={13} />
            </button>
          ))}
        </div>
        <button className="link" onClick={() => onNavigate("reports")}>View all <ArrowRight size={13} /></button>
      </div>

      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <button key={kpi.label} onClick={kpi.onClick} className={`kpi kpi-${kpi.tone}`}>
            <div className="kpi-top"><span className="kpi-label">{kpi.label}</span><span className="kpi-icon"><kpi.icon size={17} /></span></div>
            <strong className="kpi-value">{kpi.value}</strong>
            <div className="kpi-foot"><span>{kpi.detail}</span><em>{kpi.foot}</em></div>
            <i className="kpi-mark" />
          </button>
        ))}
      </section>

      <section className="grid-main">
        <RevenueChart data={data} />
        <Card>
          <CardHead title={data.organization.slug === "homigo" ? "Service requests by source" : "Sales by source"} subtitle={`Where your ${data.profile.leadPlural.toLowerCase()} come from`} actions={<button className="link" onClick={() => onNavigate("reports")}>Details</button>} />
          <SourceDonut data={data} />
          <div className="mini-metrics">
            <div><span>Best source</span><strong>{data.profile.sources[0]}</strong><small>{data.leads.filter((lead) => lead.source === data.profile.sources[0]).length} requests</small></div>
            <div><span>{data.organization.slug === "homigo" ? "Placement value" : "Pipeline value"}</span><strong>{money(data.deals.reduce((sum, deal) => sum + deal.value, 0))}</strong><small>{data.deals.length} {data.profile.dealPlural?.toLowerCase() || "active deals"}</small></div>
          </div>
        </Card>
      </section>

      <section className="grid-halves">
        <Card>
          <CardHead
            title={data.organization.slug === "homigo" ? "Placement performance" : "Sales performance"}
            subtitle={data.organization.slug === "homigo" ? "Placement value recorded this week" : "Deal value created this week"}
            actions={<button className="btn btn-secondary btn-sm" onClick={() => onNavigate("reports")}>Open report</button>}
          />
          <SalesBars data={data} />
          <div className="stat-row">
            <div><span>Top day</span><strong>{data.profile.chart.some((point) => point.value > 0) ? money(Math.max(...data.profile.chart.map((point) => point.value))) : "—"}</strong><small>Based on recorded sales</small></div>
            <div><span>{data.organization.slug === "homigo" ? "Avg. placement value" : "Avg. deal size"}</span><strong>{money(data.deals.reduce((sum, deal) => sum + deal.value, 0) / Math.max(data.deals.length, 1))}</strong><small>Across recorded placements</small></div>
            <div><span>{data.organization.slug === "homigo" ? "Placement rate" : "Win rate"}</span><strong>{conversion}%</strong><small>Based on recorded requests</small></div>
          </div>
        </Card>

        <Card>
          <CardHead title="Upcoming tasks" subtitle="Your team’s next actions" actions={<button className="link" onClick={() => onNavigate("tasks")}>All tasks</button>} />
          <div className="task-mini-list">
            {openTasks.map((task) => (
              <div key={task.id} className="task-mini">
                <button className="check-btn" onClick={() => onCompleteTask(task.id)} aria-label={`Complete ${task.title}`}><Check size={12} /></button>
                <div><p>{task.title}</p><small>{task.relatedTo} · {task.assignee}</small></div>
                <div className="task-mini-side"><Priority value={task.priority} /><time>{shortDate(task.dueAt)}</time></div>
              </div>
            ))}
            {!openTasks.length && <p className="muted-note">Your task queue is clear.</p>}
          </div>
          <div className="progress-block">
            <div><span>Today’s completion</span><b>{data.tasks.filter((task) => task.status === "completed").length}/{data.tasks.length}</b></div>
            <div className="progress-track"><i style={{ width: `${Math.min(100, data.tasks.filter((task) => task.status === "completed").length / Math.max(data.tasks.length, 1) * 100)}%` }} /></div>
          </div>
        </Card>
      </section>

      <section className="grid-main">
        <Card pad={false}>
          <div className="card-pad card-head-border">
            <CardHead title={data.organization.slug === "homigo" ? "Recent clients" : "Recent contacts"} subtitle="The latest relationships in your CRM" actions={<button className="link" onClick={() => onNavigate("contacts")}>View all <ArrowRight size={13} /></button>} />
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Contact</th><th>Company</th><th>Status</th><th>Owner</th><th>Value</th><th>Last activity</th></tr></thead>
              <tbody>
                {data.customers.slice(0, 5).map((contact) => (
                  <tr key={contact.id} onClick={() => onOpenContact(contact.id)} className="clickable">
                    <td><div className="person"><Avatar name={contact.name} size="sm" /><div><strong>{contact.name}</strong><small>{contact.email || contact.phone}</small></div></div></td>
                    <td><span className="company-cell"><Building2 size={12} /> {contact.company || "Individual"}</span></td>
                    <td><Status value={contact.segment} /></td>
                    <td>{contact.owner.split(" ")[0]}</td>
                    <td className="strong">{money(contact.totalValue)}</td>
                    <td className="muted">{shortDate(contact.lastContactAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHead title="Recent activity" subtitle="Automatically captured from the team" actions={<button className="link" onClick={() => onNavigate("reports")}>Timeline</button>} />
          <div className="activity-list">
            {data.activities.slice(0, 5).map((activity, index) => <ActivityRow key={activity.id} activity={activity} index={index} />)}
          </div>
          <div className="activity-foot">
            <span><i className="pulse-dot" /> Live activity</span>
            <button className="link" onClick={() => onNavigate("reports")}>View log</button>
          </div>
        </Card>
      </section>

      <section className="grid-halves">
        <Card>
          <CardHead title={data.organization.slug === "homigo" ? "Priority service requests" : "Hot leads"} subtitle={data.organization.slug === "homigo" ? "Client requirements that need the next action" : "Highest-scoring opportunities to call today"} actions={<button className="link" onClick={() => onNavigate("leads")}>All leads</button>} />
          <div className="hot-lead-list">
            {hotLeads.slice(0, 4).map((lead) => (
              <button key={lead.id} className="hot-lead" onClick={() => onOpenLead(lead)}>
                <Avatar name={lead.name} size="sm" />
                <div className="hot-lead-main"><strong>{lead.name}</strong><small>{lead.company || lead.source} · {money(lead.expectedValue)}</small></div>
                <Score value={lead.score} />
                <ChevronRight size={15} className="chev" />
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title={data.organization.slug === "homigo" ? "Maid workforce" : "Team performance"} subtitle={data.organization.slug === "homigo" ? "Latest worker profiles and recorded locations" : "Revenue attributed this month"} actions={<button className="link" onClick={() => onNavigate("reports")}>Report</button>} />
          {data.organization.slug === "homigo" ? <div className="team-list">
            {data.maids.slice(0, 4).map((maid, index) => (
              <div key={maid.id} className="team-row">
                <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                <Avatar name={maid.name} size="sm" />
                <div className="team-main"><div><strong>{maid.name}</strong><span>{maid.serviceTypes} · {maid.location || "Location not recorded"}</span></div><div className="progress-track"><i style={{ width: maid.availability.toLowerCase().includes("available") ? "85%" : "25%" }} /></div></div>
                <div className="team-side"><b>{maid.age ? `${maid.age} yrs` : "Age —"}</b><small>{maid.availability}</small></div>
              </div>
            ))}
          </div> : <div className="team-list">
            {team.slice(0, 4).map((member, index) => (
              <div key={member.id} className="team-row">
                <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                <Avatar name={member.name} size="sm" />
                <div className="team-main"><div><strong>{member.name}</strong><span>{member.title}</span></div><div className="progress-track"><i style={{ width: `${Math.max(18, 96 - index * 18)}%` }} /></div></div>
                <div className="team-side"><b>{money(member.revenue)}</b><small className={member.trend >= 0 ? "trend-up-text" : "trend-down-text"}>{member.trend >= 0 ? "+" : ""}{member.trend}%</small></div>
              </div>
            ))}
          </div>}
        </Card>
      </section>
    </div>
  );
}

export function EmployeeDashboard({ data, onNavigate, onOpenLead, onQuickAction, onCompleteTask, onAssistant }: {
  data: WorkspaceData;
  onNavigate: (view: string) => void;
  onOpenLead: (lead: LeadView) => void;
  onQuickAction: (lead: LeadView, action: string) => void;
  onCompleteTask: (id: number) => void;
  onAssistant: () => void;
}) {
  const employee = data.team.find((member) => member.role.toLowerCase() === "employee") ?? data.team[0];
  const openTasks = data.tasks.filter((task) => task.status !== "completed");
  const todayTasks = openTasks.filter((task) => new Date(task.dueAt).toDateString() === new Date().toDateString());
  const priority = [...data.leads].sort((a, b) => b.score - a.score).slice(0, 3);
  const completed = data.tasks.filter((task) => task.status === "completed").length;
  const progress = Math.round(completed / Math.max(data.tasks.length, 1) * 100);
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date());

  return (
    <div className="page">
      <PageHead
        eyebrow={`MY DAY · ${today.toUpperCase()}`}
        title={`Let’s get things done, ${employee.name.split(" ")[0]}.`}
        subtitle={`${todayTasks.length + priority.length} items planned for today. Start with your priority calls.`}
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={onAssistant}><Sparkles size={14} /> Who should I call?</button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("tasks")}><Plus size={15} /> Add task</button>
        </>}
      />

      <section className="kpi-grid kpi-grid-employee">
        {[
          { label: "New leads", value: data.leads.filter((lead) => lead.score >= 70).length, icon: Target, tone: "mint", hint: "Assigned to you" },
          { label: "Follow-ups", value: priority.length, icon: Phone, tone: "yellow", hint: "Due today" },
          { label: "Open tasks", value: openTasks.length, icon: Check, tone: "lilac", hint: `${todayTasks.length} scheduled today` },
          { label: "Quotes waiting", value: data.quotations.filter((quote) => quote.status !== "Accepted").length, icon: Handshake, tone: "dark", hint: "Need a nudge" },
        ].map((item) => (
          <button key={item.label} className={`kpi kpi-${item.tone}`} onClick={() => onNavigate(item.label === "Open tasks" ? "tasks" : item.label === "New leads" ? "leads" : "contacts")}>
            <div className="kpi-top"><span className="kpi-label">{item.label}</span><span className="kpi-icon"><item.icon size={17} /></span></div>
            <strong className="kpi-value">{item.value}</strong>
            <div className="kpi-foot"><span>{item.hint}</span></div>
            <i className="kpi-mark" />
          </button>
        ))}
      </section>

      <section className="grid-main">
        <Card>
          <CardHead title="Priority queue" subtitle="Highest-scoring leads — call these first" actions={<span className="badge badge-coral"><i className="dot" />Focus mode</span>} />
          <div className="priority-list">
            {priority.map((lead) => (
              <div key={lead.id} className="priority-item">
                <span className="priority-rank">{priority.indexOf(lead) + 1}</span>
                <Avatar name={lead.name} size="sm" />
                <button className="priority-main" onClick={() => onOpenLead(lead)}>
                  <strong>{lead.name}</strong>
                  <small>{lead.company || lead.source} · {money(lead.expectedValue)} · next {shortDate(lead.nextFollowUp)}</small>
                </button>
                <div className="priority-actions">
                  <button className="icon-action" onClick={() => onQuickAction(lead, "call")} aria-label={`Call ${lead.name}`}><Phone size={14} /></button>
                  <button className="icon-action whatsapp" onClick={() => onQuickAction(lead, "whatsapp")} aria-label={`WhatsApp ${lead.name}`}><MessageCircle size={14} /></button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onOpenLead(lead)}>Open</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="day-progress-card">
          <CardHead title="Today’s progress" subtitle="You’re keeping things moving" />
          <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{progress}%</strong><span>complete</span></div>
          </div>
          <div className="progress-breakdown">
            <div><span>Completed</span><b>{completed}</b></div>
            <div><span>Open</span><b>{openTasks.length}</b></div>
            <div><span>High priority</span><b>{openTasks.filter((task) => task.priority === "High").length}</b></div>
          </div>
          <p className="muted-note"><Clock3 size={12} /> Finish priority calls before 11:30 AM to stay on track.</p>
        </Card>
      </section>

      <section className="grid-main">
        <Card>
          <CardHead title="My tasks" subtitle="Tick items off as you go" actions={<button className="link" onClick={() => onNavigate("tasks")}>All tasks</button>} />
          <div className="task-mini-list">
            {openTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="task-mini">
                <button className="check-btn" onClick={() => onCompleteTask(task.id)} aria-label={`Complete ${task.title}`}><Check size={12} /></button>
                <div><p>{task.title}</p><small>{task.relatedTo} · {task.type}</small></div>
                <div className="task-mini-side"><Priority value={task.priority} /><time>{shortDate(task.dueAt)}</time></div>
              </div>
            ))}
            {!openTasks.length && <p className="muted-note">All caught up. Nice work.</p>}
          </div>
        </Card>
        <Card>
          <CardHead title="My recent activity" subtitle="Logged automatically — no reporting needed" />
          <div className="activity-list">
            {data.activities.slice(0, 5).map((activity, index) => <ActivityRow key={activity.id} activity={activity} index={index} />)}
          </div>
        </Card>
      </section>
    </div>
  );
}
