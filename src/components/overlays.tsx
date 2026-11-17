"use client";

import {
  Avatar, Field, Modal, Priority, Score, SelectField, Status, formatDate, money, shortDate, timeAgo,
} from "@/components/ui";
import type { CompanyView, CustomerView, DealView, LeadView, WorkspaceData } from "@/lib/crm-types";
import {
  ArrowLeft, ArrowRight, Bell, Bot, BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight,
  CircleDollarSign, Mail, MessageCircle, NotebookPen, Phone, Plus, Search, Send, Sparkles, Target,
  UserRound, Wallet, X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

/* ----------------------------------- quick add ------------------------------ */

export function QuickAddModal({ data, initialType = "lead", onClose, onSubmit }: {
  data: WorkspaceData;
  initialType?: "lead" | "task";
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [type, setType] = useState<"lead" | "task">(initialType);
  const [saving, setSaving] = useState(false);
  const [defaultDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    await onSubmit(type === "lead"
      ? { action: "createLead", ...payload, expectedValue: Number(payload.budget ?? payload.expectedValue ?? 0), customData: data.profile.leadFields?.length
        ? Object.fromEntries(data.profile.leadFields.map((field) => [field.key, String(payload[field.key] ?? "")]))
        : { [data.profile.customFields[0].key]: String(payload.customField ?? "") } }
      : { action: "createTask", ...payload });
    setSaving(false);
  };

  return (
    <Modal
      title={`New ${type === "lead" ? data.profile.leadLabel.toLowerCase() : "task"}`}
      subtitle="Just the essentials — you can add detail later."
      onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button><button className="btn btn-primary" type="submit" form="quick-add" disabled={saving}>{saving ? <span className="spinner" /> : <Plus size={15} />} Create</button></>}
    >
      <div className="segmented">
        <button type="button" className={type === "lead" ? "active" : ""} onClick={() => setType("lead")}><UserRound size={14} /> {data.profile.leadLabel}</button>
        <button type="button" className={type === "task" ? "active" : ""} onClick={() => setType("task")}><Check size={14} /> Task / Follow-up</button>
      </div>
      <form id="quick-add" onSubmit={submit} className="form-grid mt">
        {type === "lead" ? <>
          <Field label={data.profile.customerLabel === "Client" ? "Client / contact name" : "Full name"} required><input name="name" required autoFocus placeholder={data.profile.customerLabel === "Client" ? "Client name" : "Customer name"} /></Field>
          <Field label="Phone" required><input name="phone" type="tel" required placeholder="+91 98765 43210" /></Field>
          <Field label="Email"><input name="email" type="email" placeholder="name@company.com" /></Field>
          <Field label="Source"><select name="source" defaultValue={data.profile.sources[0]}>{data.profile.sources.map((source) => <option key={source}>{source}</option>)}</select></Field>
          <Field label="Priority"><select name="priority" defaultValue="Medium"><option>High</option><option>Medium</option><option>Low</option></select></Field>
          {data.profile.customerLabel !== "Client" && <Field label="Expected value"><input name="expectedValue" type="number" min="0" placeholder="50000" /></Field>}
          <Field label="First follow-up"><input name="nextFollowUp" type="datetime-local" defaultValue={defaultDate} /></Field>
          {data.profile.leadFields?.length ? data.profile.leadFields.map((field) => <Field key={field.key} label={field.label}>
            {field.options
              ? <select name={field.key} defaultValue=""><option value="">Select {field.label.toLowerCase()}</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select>
              : <input name={field.key} type={field.type === "number" ? "number" : "text"} min={field.type === "number" ? "0" : undefined} placeholder={field.label} />}
          </Field>) : <Field label={data.profile.customFields[0].label}><input name="customField" placeholder={data.profile.customFields[0].label} /></Field>}
        </> : <>
          <Field label="What needs to be done?" required><input name="title" required autoFocus placeholder="Send quotation to Rahul" /></Field>
          <Field label="Related to"><select name="relatedName" defaultValue=""><option value="">General task</option>{data.leads.map((lead) => <option key={lead.id}>{lead.name}</option>)}</select></Field>
          <Field label="Type"><select name="type" defaultValue="Task"><option>Task</option><option>Follow-up</option><option>Call</option><option>Meeting</option></select></Field>
          <Field label="Priority"><select name="priority" defaultValue="Medium"><option>High</option><option>Medium</option><option>Low</option></select></Field>
          <Field label="Due date & time" required><input name="dueAt" type="datetime-local" required defaultValue={defaultDate} /></Field>
        </>}
      </form>
    </Modal>
  );
}

/* ---------------------------------- contacts -------------------------------- */

export function ContactModal({ data, contact, onClose, onSave }: {
  data: WorkspaceData;
  contact: CustomerView | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const isHomigo = data.organization.slug === "homigo";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const customData = isHomigo
      ? { ...(contact?.customData || {}), ...Object.fromEntries(data.profile.customFields.map((field) => [field.key, String(values[field.key] ?? "")])) }
      : undefined;
    await onSave({
      action: contact ? "updateContact" : "createContact",
      ...(contact ? { id: contact.id } : {}),
      ...values,
      totalValue: Number(values.totalValue ?? 0),
      ...(customData ? { customData } : {}),
    });
    setSaving(false);
  };
  return (
    <Modal
      title={contact ? (isHomigo ? "Edit client" : "Edit contact") : (isHomigo ? "Add client" : "Add contact")}
      subtitle={contact ? "Keep this client and service record up to date." : `Add a ${data.profile.customerLabel.toLowerCase()} to ${data.organization.name}.`}
      onClose={onClose}
      footer={<><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" form="contact-form" disabled={saving}>{saving ? <span className="spinner" /> : <Check size={15} />} {contact ? "Save changes" : (isHomigo ? "Add client" : "Create contact")}</button></>}
    >
      <form id="contact-form" onSubmit={submit} className="form-grid">
        <Field label={isHomigo ? "Client / contact name" : "Full name"} required><input name="name" required autoFocus defaultValue={contact?.name ?? ""} placeholder={isHomigo ? "Client name" : "Contact name"} /></Field>
        <Field label="Phone" required><input name="phone" type="tel" required defaultValue={contact?.phone ?? ""} placeholder="+91 98765 43210" /></Field>
        <Field label="Email"><input name="email" type="email" defaultValue={contact?.email ?? ""} placeholder="name@company.com" /></Field>
        <Field label={isHomigo ? "Property / account type" : "Company"}><input name="company" defaultValue={contact?.company ?? ""} placeholder={isHomigo ? "House, apartment, resort..." : "Company name"} /></Field>
        <Field label="Client status"><select name="segment" defaultValue={contact?.segment ?? "Active"}><option>Active</option><option>Hot Lead</option><option>VIP</option><option>New</option><option>Inactive</option></select></Field>
        <Field label={isHomigo ? "Recorded client value (₹)" : "Lifetime value"}><input name="totalValue" type="number" min="0" defaultValue={contact?.totalValue ?? 0} /></Field>
        {isHomigo && data.profile.customFields.map((field) => (
          <Field key={field.key} label={field.label}>
            {field.key === "service_type"
              ? <select name={field.key} defaultValue={String(contact?.customData[field.key] ?? "")}><option value="">Select service type</option>{["Full-time maid", "Live-in maid", "Part-time maid", "House cleaning", "Kitchen cleaning", "Elder care", "Child care", "Other"].map((option) => <option key={option}>{option}</option>)}</select>
              : field.key === "lead_temperature"
                ? <select name={field.key} defaultValue={String(contact?.customData[field.key] ?? "Warm")}><option>Hot</option><option>Warm</option><option>Cold</option></select>
                : <input name={field.key} type={field.key === "area_sqft" ? "number" : "text"} min={field.key === "area_sqft" ? "0" : undefined} defaultValue={String(contact?.customData[field.key] ?? "")} placeholder={field.label} />}
          </Field>
        ))}
      </form>
    </Modal>
  );
}

export function DealModal({ data, onClose, onSave }: {
  data: WorkspaceData;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [closeDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 21);
    return date.toISOString().slice(0, 10);
  });
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedMaidId, setSelectedMaidId] = useState("");
  const isHomigo = data.organization.slug === "homigo";
  const suggestedMaids = useMemo(() => {
    if (!isHomigo) return [];
    const request = data.leads.find((lead) => String(lead.id) === selectedRequestId);
    if (!request) return [];
    const requiredSkills = String(request.customData.service_type || request.customData.requirement || "").toLowerCase();
    const requiredArea = String(request.customData.location || "").toLowerCase();
    return data.maids.map((maid) => {
      const skills = maid.serviceTypes.toLowerCase();
      const area = maid.location.toLowerCase();
      const availability = maid.availability.toLowerCase();
      const skillMatch = Boolean(requiredSkills && skills !== "not specified" && skills.includes(requiredSkills));
      const areaMatch = Boolean(requiredArea && area && (area.includes(requiredArea) || requiredArea.includes(area)));
      const available = availability.includes("available") && !availability.includes("not available");
      const score = (skillMatch ? 4 : 0) + (areaMatch ? 3 : 0) + (available ? 2 : 0);
      return { ...maid, score, skillMatch, areaMatch, available };
    }).sort((left, right) => right.score - left.score).slice(0, 4);
  }, [data.leads, data.maids, isHomigo, selectedRequestId]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const clientFee = Number(values.clientFee ?? values.value ?? 0);
    await onSave({
      action: "createDeal",
      ...values,
      contactId: values.contactId ? Number(values.contactId) : null,
      value: isHomigo ? clientFee : Number(values.value ?? 0),
      stageId: Number(values.stageId),
      probability: Number(values.probability ?? (isHomigo ? 80 : 50)),
      ...(isHomigo ? {
        maidId: values.maidId ? Number(values.maidId) : null,
        serviceRequestId: values.serviceRequestId ? Number(values.serviceRequestId) : null,
        startAt: String(values.startAt || closeDate),
        expectedCloseAt: String(values.startAt || closeDate),
        workerPay: Number(values.workerPay ?? 0),
        clientFee,
        placementNotes: String(values.placementNotes || ""),
      } : {}),
    });
    setSaving(false);
  };
  return (
    <Modal
      title={isHomigo ? "Create maid placement" : "New deal"}
      subtitle={isHomigo ? "Link a client, assigned maid, agreed service fee and start schedule." : `Add an opportunity to ${data.profile.pipelineName}.`}
      onClose={onClose}
      wide={isHomigo}
      footer={<><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" form="deal-form" disabled={saving}>{saving ? <span className="spinner" /> : <Plus size={15} />} {isHomigo ? "Create placement" : "Create deal"}</button></>}
    >
      <form id="deal-form" onSubmit={submit} className="form-grid">
        <Field label={isHomigo ? "Placement title" : "Deal name"} required><input name="title" required autoFocus placeholder={isHomigo ? "e.g. Full-time maid for Anjana Nair" : `e.g. ${data.profile.productLabel} for Acme`} /></Field>
        {!isHomigo && <Field label="Company"><input name="company" placeholder="Company name" /></Field>}
        <Field label={isHomigo ? "Client" : "Contact"}><select name="contactId" defaultValue=""><option value="">No client selected</option>{data.customers.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.phone}</option>)}</select></Field>
        {isHomigo && <>
          <Field label="Assign maid" required><select name="maidId" required value={selectedMaidId} onChange={(event) => setSelectedMaidId(event.target.value)}><option value="">Select a maid</option>{data.maids.map((maid) => <option key={maid.id} value={maid.id}>{maid.name} · {maid.location || "Location not recorded"} · {maid.availability}</option>)}</select></Field>
          <Field label="Related service request"><select name="serviceRequestId" value={selectedRequestId} onChange={(event) => { setSelectedRequestId(event.target.value); setSelectedMaidId(""); }}><option value="">No linked request</option>{data.leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.customData.service_type || "Service request"}</option>)}</select></Field>
          {selectedRequestId && <div className="field full">
            <span className="field-label">Suggested maid matches</span>
            <small className="muted-note">Suggestions use only recorded skills, area and availability. Confirm directly with the worker before promising a placement.</small>
            {suggestedMaids.length ? <div className="mobile-list">
              {suggestedMaids.map((maid) => <div className="mobile-row" key={maid.id}>
                <div className="mobile-row-top"><div className="person"><Avatar name={maid.name} size="sm" /><div><strong>{maid.name}</strong><small>{maid.location || "Location not recorded"} · {maid.serviceTypes}</small></div></div><Status value={maid.availability} /></div>
                <div className="mobile-row-actions"><button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedMaidId(String(maid.id))}>{selectedMaidId === String(maid.id) ? "Selected" : "Select this maid"}</button></div>
              </div>)}
            </div> : <p className="muted-note">No maid profiles to compare yet. Add workers to the Maid Directory first.</p>}
          </div>}
          <Field label="Service start date" required><input name="startAt" type="date" required defaultValue={closeDate} /></Field>
          <Field label="Schedule / shift"><input name="schedule" placeholder="e.g. Mon–Sat, 8 AM–5 PM" /></Field>
          <Field label="Client fee (₹)" required><input name="clientFee" type="number" min="0" required placeholder="Monthly / placement fee" /></Field>
          <Field label="Worker pay (₹)"><input name="workerPay" type="number" min="0" placeholder="Agreed maid salary / pay" /></Field>
          <Field label="Placement status"><select name="placementStatus" defaultValue="Scheduled"><option>Scheduled</option><option>Awaiting start</option><option>Active</option><option>On hold</option><option>Completed</option><option>Cancelled</option></select></Field>
          <div className="field full"><span className="field-label">Placement notes</span><textarea name="placementNotes" rows={3} placeholder="Service scope, handover, agreed terms or follow-up notes..." /></div>
        </>}
        {!isHomigo && <>
          <Field label="Value" required><input name="value" type="number" min="0" required placeholder="50000" /></Field>
          <Field label="Stage"><select name="stageId" defaultValue={data.stages[0]?.id}>{data.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></Field>
          <Field label="Expected close" required><input name="expectedCloseAt" type="date" required defaultValue={closeDate} /></Field>
          <Field label="Probability %"><input name="probability" type="number" min="0" max="100" defaultValue={50} /></Field>
        </>}
        {isHomigo && <Field label="Stage"><select name="stageId" defaultValue={data.stages.find((stage) => stage.name === "Placed")?.id ?? data.stages[0]?.id}>{data.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></Field>}
        <Field label="Priority"><select name="priority" defaultValue="Medium"><option>High</option><option>Medium</option><option>Low</option></select></Field>
        <Field label="Source"><select name="source" defaultValue={data.profile.sources[0]}>{data.profile.sources.map((source) => <option key={source}>{source}</option>)}</select></Field>
      </form>
    </Modal>
  );
}

export function ManualInvoiceModal({ data, onClose, onSave }: {
  data: WorkspaceData;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [dueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  });
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    await onSave({
      action: "createManualInvoice",
      customerId: Number(values.customerId),
      description: String(values.description || ""),
      totalAmount: Number(values.totalAmount || 0),
      paidAmount: Number(values.paidAmount || 0),
      dueAt: String(values.dueAt || ""),
    });
    setSaving(false);
  };
  return (
    <Modal
      title="Create manual invoice"
      subtitle="Create an invoice for an existing HOMIGO client. Any advance received is recorded against the invoice."
      onClose={onClose}
      wide
      footer={<><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" form="manual-invoice-form" disabled={saving}>{saving ? <span className="spinner" /> : <Plus size={15} />} Create invoice</button></>}
    >
      <form id="manual-invoice-form" onSubmit={submit} className="form-grid">
        <Field label="Client" required>
          <select name="customerId" required defaultValue="">
            <option value="">Select client</option>
            {data.customers.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.phone}</option>)}
          </select>
        </Field>
        <Field label="Invoice description" required><input name="description" required placeholder="e.g. Monthly full-time maid service" /></Field>
        <Field label="Invoice amount (₹)" required><input name="totalAmount" type="number" min="1" step="1" required placeholder="15000" /></Field>
        <Field label="Advance received (₹)"><input name="paidAmount" type="number" min="0" step="1" defaultValue="0" placeholder="0" /></Field>
        <Field label="Payment due date" required><input name="dueAt" type="date" required defaultValue={dueDate} /></Field>
        <div className="field full"><span className="field-label">Invoice note</span><small className="muted-note">The invoice reference is generated automatically. The unpaid balance will appear in Payments &amp; Dues, where you can record the remaining payment later.</small></div>
      </form>
    </Modal>
  );
}

export function ConfirmDialog({ title, detail, confirmLabel, onCancel, onConfirm }: {
  title: string;
  detail: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={title}
      subtitle={detail}
      onClose={onCancel}
      footer={<><button className="btn btn-secondary" onClick={onCancel}>Cancel</button><button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button></>}
    >
      <p className="confirm-note">This action updates the shared workspace immediately and is recorded in the activity timeline.</p>
    </Modal>
  );
}

/* ---------------------------------- drawers --------------------------------- */

const activityIcons: Record<string, typeof Phone> = {
  call: Phone, note: NotebookPen, quote: BriefcaseBusiness, message: MessageCircle, whatsapp: MessageCircle,
  calendar: CalendarDays, followup: CalendarDays, payment: CircleDollarSign, lead: Target,
  complete: Check, stage: ArrowRight, deal: ChevronRight, contact: UserRound, assignment: UserRound,
};

function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="overlay drawer-overlay">
      <button className="overlay-scrim" onClick={onClose} aria-label="Close panel" />
      <aside className="drawer">{children}</aside>
    </div>
  );
}

function Timeline({ data, leadId, customerId }: { data: WorkspaceData; leadId?: number; customerId?: number }) {
  const activities = data.activities.filter((activity) => (leadId ? activity.leadId === leadId : true) && (customerId ? activity.customerId === customerId : true)).slice(0, 7);
  const list = activities.length ? activities : data.activities.slice(0, 5);
  return (
    <div className="timeline">
      {list.map((activity) => {
        const Icon = activityIcons[activity.type] ?? NotebookPen;
        return (
          <div key={activity.id} className="timeline-item">
            <span className={`timeline-icon ${activity.type}`}><Icon size={13} /></span>
            <div><div className="timeline-top"><p>{activity.title}</p><time>{timeAgo(activity.createdAt)}</time></div><small>{activity.detail}</small><em>{activity.actor}</em></div>
          </div>
        );
      })}
      {!list.length && <p className="muted-note">No activity recorded yet.</p>}
    </div>
  );
}

export function LeadDrawer({ data, lead, onClose, onAction, onAssign, onStage }: {
  data: WorkspaceData;
  lead: LeadView;
  onClose: () => void;
  onAction: (lead: LeadView, action: string) => void;
  onAssign: (lead: LeadView, userId: number) => void;
  onStage: (lead: LeadView, stageId: number) => void;
}) {
  const currentIndex = data.stages.findIndex((stage) => stage.id === lead.stageId);
  return (
    <Drawer onClose={onClose}>
      <header className="drawer-head">
        <div className="drawer-person"><Avatar name={lead.name} size="lg" /><div><div className="drawer-name"><h2>{lead.name}</h2><Priority value={lead.priority} /></div><p>{lead.company || lead.source} · {data.profile.leadLabel}</p><Score value={lead.score} /></div></div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={17} /></button>
      </header>
      <div className="drawer-body">
        <div className="quick-grid">
          <button onClick={() => onAction(lead, "call")}><span><Phone size={17} /></span>Call</button>
          <button className="whatsapp" onClick={() => onAction(lead, "whatsapp")}><span><MessageCircle size={17} /></span>WhatsApp</button>
          <button onClick={() => onAction(lead, "followup")}><span><CalendarDays size={17} /></span>Follow-up</button>
          <button onClick={() => onAction(lead, "note")}><span><NotebookPen size={17} /></span>Note</button>
          <button onClick={() => onAction(lead, "quote")}><span><BriefcaseBusiness size={17} /></span>Quote</button>
        </div>

        <section className="drawer-section">
          <div className="drawer-section-head"><h3>{data.organization.slug === "homigo" ? "Request progress" : "Sales progress"}</h3><Status value={lead.stage} /></div>
          <div className="stage-progress">{data.stages.map((stage, index) => <i key={stage.id} style={{ background: index <= currentIndex ? stage.color : "#333635" }} title={stage.name} />)}</div>
          <div className="drawer-value-row">
            <div><span>{data.organization.slug === "homigo" ? "Estimated budget / value" : "Expected value"}</span><strong>{money(lead.expectedValue, false)}</strong></div>
            <span className="select-inline">
              <select value={String(lead.stageId)} onChange={(event) => onStage(lead, Number(event.target.value))} aria-label="Move lead stage">
                {data.stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
              </select><ChevronDownIcon />
            </span>
          </div>
        </section>

        <section className="drawer-section">
          <h3>Assignment & contact</h3>
          <div className="detail-grid">
            <div><span>Owner</span>
              <span className="select-inline wide">
                <select value={String(lead.assignedToId ?? "")} onChange={(event) => onAssign(lead, Number(event.target.value))} aria-label="Assign lead">
                  <option value="" disabled>Unassigned</option>
                  {data.team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select><ChevronDownIcon />
              </span>
            </div>
            <div><span>Phone</span><strong><a href={`tel:${lead.phone}`}>{lead.phone}</a></strong></div>
            <div><span>Email</span><strong>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : "Not added"}</strong></div>
            <div><span>Next follow-up</span><strong className={lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date() ? "danger-text" : ""}>{lead.nextFollowUp ? formatDate(lead.nextFollowUp, true) : "Not set"}</strong></div>
            <div><span>Source</span><strong>{lead.source}</strong></div>
            <div><span>Created</span><strong>{shortDate(lead.createdAt)}</strong></div>
          </div>
        </section>

        <section className="drawer-section">
          <h3>{data.organization.slug === "homigo" ? "Service requirement" : data.organization.industry + " details"}</h3>
          <div className="detail-grid">
            {(data.profile.leadFields || data.profile.customFields).map((field) => <div key={field.key}><span>{field.label}</span><strong>{lead.customData[field.key] || "Not added"}</strong></div>)}
          </div>
        </section>

        <section className="drawer-section"><h3>Notes</h3><p className="note-box">{lead.notes || "No notes added yet."}</p></section>
        <section className="drawer-section"><div className="drawer-section-head"><h3>Activity timeline</h3><button className="link" onClick={() => onAction(lead, "note")}><Plus size={12} /> Log activity</button></div><Timeline data={data} leadId={lead.id} /></section>
      </div>
    </Drawer>
  );
}

function ChevronDownIcon() {
  return <ChevronRight size={12} className="chev-down" />;
}

export function CustomerDrawer({ data, contact, onClose, onEdit, onDelete }: {
  data: WorkspaceData;
  contact: CustomerView;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const payments = data.payments.filter((payment) => payment.customer === contact.name);
  const deals = data.deals.filter((deal) => deal.contact === contact.name);
  return (
    <Drawer onClose={onClose}>
      <header className="drawer-head">
        <div className="drawer-person"><Avatar name={contact.name} size="lg" /><div><div className="drawer-name"><h2>{contact.name}</h2><Status value={contact.segment} /></div><p>{contact.company || data.profile.customerLabel} · Owner {contact.owner}</p></div></div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={17} /></button>
      </header>
      <div className="drawer-body">
        <div className="quick-grid">
          <a href={`tel:${contact.phone}`}><span><Phone size={17} /></span>Call</a>
          <a className="whatsapp" href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"><span><MessageCircle size={17} /></span>WhatsApp</a>
          <a href={`mailto:${contact.email}`}><span><Mail size={17} /></span>Email</a>
          <button onClick={onEdit}><span><NotebookPen size={17} /></span>Edit</button>
          <button onClick={onDelete}><span><BoxesIcon /></span>Delete</button>
        </div>

        <section className="value-banner">
          <div><span>Lifetime value</span><strong>{money(contact.totalValue, false)}</strong><small>{deals.length} deals · {payments.length} payments</small></div>
          <span><Wallet size={20} /></span>
        </section>

        <section className="drawer-section"><h3>Contact details</h3>
          <div className="detail-grid">
            <div><span>Phone</span><strong><a href={`tel:${contact.phone}`}>{contact.phone}</a></strong></div>
            <div><span>Email</span><strong>{contact.email || "Not added"}</strong></div>
            <div><span>Company</span><strong>{contact.company || "Individual"}</strong></div>
            <div><span>Relationship owner</span><strong>{contact.owner}</strong></div>
            <div><span>Status</span><strong>{contact.segment}</strong></div>
            <div><span>Last activity</span><strong>{shortDate(contact.lastContactAt)}</strong></div>
          </div>
        </section>

        <section className="drawer-section"><h3>{data.profile.productLabel} details</h3>
          <div className="detail-grid">{data.profile.customFields.map((field) => <div key={field.key}><span>{field.label}</span><strong>{contact.customData[field.key] || "Not added"}</strong></div>)}</div>
        </section>

        <section className="drawer-section"><div className="drawer-section-head"><h3>Deals</h3><span className="badge badge-gray">{deals.length}</span></div>
          {deals.length ? deals.map((deal) => <div key={deal.id} className="mini-record"><span className="mini-record-icon"><BriefcaseBusiness size={14} /></span><div><strong>{deal.title}</strong><small>{deal.stage} · closes {shortDate(deal.expectedCloseAt)}</small></div><b>{money(deal.value)}</b></div>) : <p className="muted-note">No open deals for this contact.</p>}
        </section>

        <section className="drawer-section"><div className="drawer-section-head"><h3>Payments</h3><span className="badge badge-gray">{payments.length}</span></div>
          {payments.length ? payments.map((payment) => <div key={payment.id} className="mini-record"><span className="mini-record-icon"><CircleDollarSign size={14} /></span><div><strong>{payment.description}</strong><small>{payment.reference} · due {shortDate(payment.dueAt)}</small></div><div className="mini-record-side"><b>{money(payment.totalAmount)}</b><Status value={payment.status} /></div></div>) : <p className="muted-note">No linked payments.</p>}
        </section>

        <section className="drawer-section"><h3>Activity timeline</h3><Timeline data={data} customerId={contact.id} /></section>
      </div>
    </Drawer>
  );
}

function BoxesIcon() {
  return <BriefcaseBusiness size={17} />;
}

export function CompanyDrawer({ data, company, onClose, onOpenContact }: { data: WorkspaceData; company: CompanyView; onClose: () => void; onOpenContact: (contact: CustomerView) => void }) {
  const contacts = data.customers.filter((contact) => (contact.company || contact.name) === company.name);
  const deals = data.deals.filter((deal) => deal.company === company.name);
  return (
    <Drawer onClose={onClose}>
      <header className="drawer-head">
        <div className="drawer-person"><span className="company-logo large">{company.initials}</span><div><div className="drawer-name"><h2>{company.name}</h2><Status value={company.status} /></div><p>{company.industry} · {company.location}</p></div></div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={17} /></button>
      </header>
      <div className="drawer-body">
        <div className="drawer-stat-grid">
          <div><span>Contacts</span><strong>{company.contacts}</strong></div>
          <div><span>Open deals</span><strong>{company.openDeals}</strong></div>
          <div><span>Pipeline</span><strong>{money(company.value)}</strong></div>
        </div>
        <section className="drawer-section"><div className="drawer-section-head"><h3>People</h3><span className="badge badge-gray">{contacts.length}</span></div>
          {contacts.map((contact) => <button key={contact.id} className="mini-record as-button" onClick={() => onOpenContact(contact)}><Avatar name={contact.name} size="sm" /><div><strong>{contact.name}</strong><small>{contact.email || contact.phone}</small></div><Status value={contact.segment} /></button>)}
        </section>
        <section className="drawer-section"><div className="drawer-section-head"><h3>Open deals</h3><span className="badge badge-gray">{deals.length}</span></div>
          {deals.length ? deals.map((deal) => <div key={deal.id} className="mini-record"><span className="mini-record-icon"><BriefcaseBusiness size={14} /></span><div><strong>{deal.title}</strong><small>{deal.stage} · {deal.probability}% · {shortDate(deal.expectedCloseAt)}</small></div><b>{money(deal.value)}</b></div>) : <p className="muted-note">No open deals for this company.</p>}
        </section>
        <section className="drawer-section"><h3>Details</h3><div className="detail-grid"><div><span>Owner</span><strong>{company.owner}</strong></div><div><span>Industry</span><strong>{company.industry}</strong></div><div><span>Location</span><strong>{company.location}</strong></div><div><span>Status</span><strong>{company.status}</strong></div></div></section>
      </div>
    </Drawer>
  );
}

/* --------------------------------- assistant -------------------------------- */

export function AssistantPanel({ data, employeeMode, onClose }: { data: WorkspaceData; employeeMode: boolean; onClose: () => void }) {
  const prompts = employeeMode
    ? ["Who should I call first?", "What are my pending tasks?", "Which enquiries need follow-up?"]
    : ["How many maid profiles do we have?", "Which client requests need follow-up today?", "Which maids match this service request?", "Summarise active placements and pending starts"];
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([{
    role: "assistant",
    text: `I’m your HOMIGO agency assistant. I can review client requests, maid profiles, placement schedules, follow-ups and payments using your CRM data.`,
  }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "AI assistant could not answer just now.");
      setMessages((current) => [...current, { role: "assistant", text: result.answer || "I could not produce an answer for that question." }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        text: error instanceof Error ? error.message : "AI assistant is temporarily unavailable. Please try again.",
      }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay drawer-overlay">
      <button className="overlay-scrim" onClick={onClose} aria-label="Close assistant" />
      <aside className="assistant-panel">
        <header className="assistant-head">
          <div className="assistant-brand"><span><Sparkles size={18} /></span><div><h2>AI Business Assistant</h2><p><i /> Live CRM context · AI Gateway</p></div></div>
          <button className="icon-btn dark" onClick={onClose} aria-label="Close"><X size={17} /></button>
        </header>
        <div className="assistant-context"><Bot size={14} /> {employeeMode ? "Focused on your assigned work" : `Viewing ${data.organization.name}`}</div>
        <div className="assistant-messages">
          {messages.map((message, index) => (
            <div key={index} className={`chat ${message.role}`}>
              {message.role === "assistant" && <span className="chat-avatar"><Sparkles size={12} /></span>}
              <p>{message.text}</p>
            </div>
          ))}
          {busy && <div className="chat assistant"><span className="chat-avatar"><Sparkles size={12} /></span><p><span className="spinner" /> Reviewing your CRM…</p></div>}
        </div>
        <div className="assistant-prompts">{prompts.map((prompt) => <button key={prompt} disabled={busy} onClick={() => void ask(prompt)}>{prompt}<ChevronRight size={12} /></button>)}</div>
        <form className="assistant-input" onSubmit={(event) => { event.preventDefault(); void ask(input); }}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask your AI business assistant..." disabled={busy} />
          <button aria-label="Send" disabled={busy || !input.trim()}><Send size={15} /></button>
        </form>
      </aside>
    </div>
  );
}

/* ------------------------------- notifications ------------------------------ */

export function NotificationsPanel({ data, onClose }: { data: WorkspaceData; onClose: () => void }) {
  const unread = useMemo(() => data.notifications.filter((item) => !item.isRead).length, [data.notifications]);
  return (
    <div className="overlay drawer-overlay">
      <button className="overlay-scrim" onClick={onClose} aria-label="Close notifications" />
      <aside className="notification-panel">
        <header><div><div className="notif-title"><Bell size={17} /><h2>Notifications</h2><span className="count">{unread}</span></div><p>Only updates that need an action</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={17} /></button></header>
        <div className="notif-list">
          {data.notifications.map((notification) => (
            <button key={notification.id} className={`notif-item ${notification.isRead ? "read" : ""}`}>
              <span className={`notif-dot ${notification.severity}`} />
              <div><p>{notification.title}</p><small>{notification.detail}</small><div className="notif-meta"><time>{timeAgo(notification.createdAt)}</time><em>{notification.actionLabel} <ArrowRight size={11} /></em></div></div>
            </button>
          ))}
        </div>
        <button className="notif-foot">View notification centre</button>
      </aside>
    </div>
  );
}

/* -------------------------------- onboarding -------------------------------- */

const onboardingIndustries = [
  "Insurance", "Real Estate", "Retail", "Wholesale", "E-commerce", "Construction", "Automobile", "Education", "Healthcare",
  "Travel & Tourism", "Hospitality", "Beauty & Salon", "Digital Marketing", "IT & Software", "Professional Services", "Logistics", "Manufacturing", "Finance", "Other",
];

export function OnboardingModal({ onClose, onFinish }: { onClose: () => void; onFinish: (businessName: string, industry: string) => void }) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState("Insurance");
  const [businessName, setBusinessName] = useState("");
  return (
    <Modal
      title={step === 1 ? "What type of business do you run?" : "Tell us the basics"}
      subtitle={step === 1 ? "We’ll adapt terminology, fields and pipeline automatically." : `We’ll configure your ${industry.toLowerCase()} workspace in seconds.`}
      onClose={onClose}
      wide
      footer={step === 1
        ? <><button className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => setStep(2)}>Continue <ArrowRight size={14} /></button></>
        : <><button className="btn btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button><button className="btn btn-primary" type="submit" form="onboarding-form">Configure workspace <Sparkles size={14} /></button></>}
    >
      <div className="onboarding-progress"><span style={{ width: step === 1 ? "50%" : "100%" }} /></div>
      {step === 1 ? (
        <div className="industry-grid">
          {onboardingIndustries.map((item) => (
            <button key={item} onClick={() => setIndustry(item)} className={industry === item ? "active" : ""}>
              <span><BriefcaseBusiness size={15} /></span><strong>{item}</strong>{industry === item && <Check size={13} />}
            </button>
          ))}
        </div>
      ) : (
        <form id="onboarding-form" className="form-grid" onSubmit={(event) => { event.preventDefault(); onFinish(businessName || "My Business", industry); }}>
          <Field label="Business name" required><input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required autoFocus placeholder="e.g. Acme Services" /></Field>
          <Field label="Business type"><select defaultValue="Private company"><option>Sole proprietorship</option><option>Partnership</option><option>Private company</option><option>Public company</option><option>Non-profit</option></select></Field>
          <Field label="Employees"><select defaultValue="11–25"><option>Just me</option><option>1–10</option><option>11–25</option><option>26–50</option><option>51–100</option><option>100+</option></select></Field>
          <Field label="Locations"><input type="number" min="1" defaultValue={1} /></Field>
          <Field label="Country"><select defaultValue="India"><option>India</option><option>United Arab Emirates</option><option>Saudi Arabia</option><option>United Kingdom</option><option>United States</option><option>Other</option></select></Field>
          <Field label="Currency"><select defaultValue="INR"><option>INR — ₹</option><option>AED — د.إ</option><option>USD — $</option><option>GBP — £</option><option>EUR — €</option></select></Field>
          <div className="onboarding-note"><strong>Ready to adapt:</strong> Opero will start with a recommended {industry} pipeline, fields and dashboard. Everything can change later.</div>
        </form>
      )}
    </Modal>
  );
}

/* ------------------------------- command search ----------------------------- */

export function CommandPalette({ data, onClose, onNavigate, onOpenLead, onOpenContact, onOpenDeal }: {
  data: WorkspaceData;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenLead: (lead: LeadView) => void;
  onOpenContact: (contact: CustomerView) => void;
  onOpenDeal: (deal: DealView) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.toLowerCase();
  const leads = data.leads.filter((lead) => `${lead.name} ${lead.company}`.toLowerCase().includes(term)).slice(0, 3);
  const contacts = data.customers.filter((contact) => `${contact.name} ${contact.company}`.toLowerCase().includes(term)).slice(0, 3);
  const deals = data.deals.filter((deal) => `${deal.title} ${deal.company}`.toLowerCase().includes(term)).slice(0, 3);
  const pages = [["Dashboard", "dashboard"], ["Contacts", "contacts"], ["Companies", "companies"], ["Leads", "leads"], ["Deals", "deals"], ["Sales pipeline", "pipeline"], ["Tasks", "tasks"], ["Calendar", "calendar"], ["Reports", "reports"], ["Settings", "settings"]].filter(([label]) => label.toLowerCase().includes(term));

  return (
    <div className="command-overlay">
      <button className="overlay-scrim" onClick={onClose} aria-label="Close search" />
      <section className="command">
        <div className="command-input"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contacts, deals, leads or pages..." /><button onClick={onClose}>ESC</button></div>
        <div className="command-results">
          {!!pages.length && <><p className="eyebrow">PAGES</p>{pages.map(([label, view]) => <button key={view} onClick={() => { onNavigate(view); onClose(); }}><span className="command-icon"><Target size={14} /></span><div><strong>{label}</strong><small>Go to page</small></div><ArrowRight size={13} /></button>)}</>}
          {!!leads.length && <><p className="eyebrow">LEADS</p>{leads.map((lead) => <button key={lead.id} onClick={() => { onOpenLead(lead); onClose(); }}><Avatar name={lead.name} size="xs" /><div><strong>{lead.name}</strong><small>{lead.stage} · {money(lead.expectedValue)}</small></div><ArrowRight size={13} /></button>)}</>}
          {!!contacts.length && <><p className="eyebrow">CONTACTS</p>{contacts.map((contact) => <button key={contact.id} onClick={() => { onOpenContact(contact); onClose(); }}><Avatar name={contact.name} size="xs" /><div><strong>{contact.name}</strong><small>{contact.company || contact.phone}</small></div><ArrowRight size={13} /></button>)}</>}
          {!!deals.length && <><p className="eyebrow">DEALS</p>{deals.map((deal) => <button key={deal.id} onClick={() => { onOpenDeal(deal); onClose(); }}><span className="command-icon"><Building2 size={14} /></span><div><strong>{deal.title}</strong><small>{deal.stage} · {money(deal.value)}</small></div><ArrowRight size={13} /></button>)}</>}
        </div>
        <footer className="command-foot"><span>Search is scoped to {data.organization.name}</span><span>↵ to open</span></footer>
      </section>
    </div>
  );
}
