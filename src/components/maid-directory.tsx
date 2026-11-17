"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { MaidView, WorkspaceData } from "@/lib/crm-types";
import { MaidVoiceAssistant } from "@/components/maid-voice-assistant";
import { Avatar, Card, CardHead, Empty, ExportButton, Field, Modal, PageHead, SelectField, Status, downloadCsv } from "@/components/ui";
import { MapPin, Phone, Plus, Search, Sparkles, UserRound, Users } from "lucide-react";

type MaidForm = {
  name: string;
  phone: string;
  age: string;
  location: string;
  serviceTypes: string;
  availability: string;
  workNotes: string;
};

const blank: MaidForm = {
  name: "", phone: "", age: "", location: "", serviceTypes: "",
  availability: "Not confirmed", workNotes: "",
};

export function MaidDirectoryView({ data, onSave }: {
  data: WorkspaceData;
  onSave: (payload: Record<string, unknown>, success: string) => Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("All availability");
  const [editing, setEditing] = useState<MaidView | null | false>(false);
  const [form, setForm] = useState<MaidForm>(blank);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => data.maids.filter((maid) => {
    const haystack = [maid.name, maid.phone, maid.location, maid.serviceTypes, maid.workNotes].join(" ").toLowerCase();
    const matchQuery = haystack.includes(query.toLowerCase());
    const status = maid.availability.toLowerCase();
    const matchAvailability = availability === "All availability"
      || (availability === "Available" && status.includes("available") && !status.includes("not available"))
      || (availability === "Not confirmed" && (status === "not confirmed" || !status))
      || (availability === "Not available" && status.includes("not available"));
    return matchQuery && matchAvailability;
  }), [data.maids, query, availability]);

  const openNew = () => { setEditing(null); setForm(blank); };
  const openEdit = (maid: MaidView) => {
    setEditing(maid);
    setForm({
      name: maid.name, phone: maid.phone, age: maid.age, location: maid.location,
      serviceTypes: maid.serviceTypes === "Not specified" ? "" : maid.serviceTypes,
      availability: maid.availability || "Not confirmed", workNotes: maid.workNotes,
    });
  };
  const close = () => { setEditing(false); setForm(blank); };
  const set = (key: keyof MaidForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const payload = editing
      ? { action: "updateMaid", id: editing.id, ...form }
      : { action: "createMaid", ...form };
    const ok = await onSave(payload, editing ? "Staff profile updated" : "Staff member added to directory");
    setSaving(false);
    if (ok) close();
  };

  const availableCount = data.maids.filter((maid) => maid.availability.toLowerCase().includes("available") && !maid.availability.toLowerCase().includes("not available")).length;
  const exportCsv = () => downloadCsv("homigo-staff-directory.csv", [
    ["Name", "Phone", "Age", "Location", "Services", "Availability", "Work Notes", "Verification Note"],
    ...filtered.map((maid) => [maid.name, maid.phone, maid.age, maid.location, maid.serviceTypes, maid.availability, maid.workNotes, maid.verificationNote]),
  ]);

  return (
    <div className="page">
      <PageHead
        eyebrow="HOMIGO · STAFF"
        title="Staff Directory"
        subtitle="Keep worker contact details, service skills, local availability and work notes in one place."
        actions={<><ExportButton onClick={exportCsv} /><button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add staff member</button></>}
      />
      <MaidVoiceAssistant data={data} onSave={onSave} />
      <section className="summary-row">
        <div className="summary-card"><span className="summary-icon mint"><Users size={16} /></span><div><small>Total staff profiles</small><strong>{data.maids.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon yellow"><UserRound size={16} /></span><div><small>Availability confirmed</small><strong>{availableCount}</strong></div></div>
        <div className="summary-card"><span className="summary-icon lilac"><MapPin size={16} /></span><div><small>Locations recorded</small><strong>{new Set(data.maids.map((maid) => maid.location).filter(Boolean)).size}</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><Sparkles size={16} /></span><div><small>Need profile check</small><strong>{data.maids.filter((maid) => !maid.verificationNote || maid.verificationNote.toLowerCase().includes("verify") || maid.verificationNote.toLowerCase().includes("not verified")).length}</strong></div></div>
      </section>
      <Card pad={false}>
        <div className="table-toolbar">
          <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, area or service..." /></label>
          <div className="toolbar-actions">
            <SelectField ariaLabel="Filter by availability" value={availability} onChange={setAvailability} options={["All availability", "Available", "Not confirmed", "Not available"].map((value) => ({ value, label: value }))} />
            <span className="badge badge-gray">{filtered.length} profiles</span>
          </div>
        </div>
        <div className="table-wrap desktop-only">
          <table className="data-table">
            <thead><tr><th>Staff member</th><th>Phone</th><th>Age</th><th>Location</th><th>Services / skills</th><th>Availability</th><th>Profile notes</th><th /></tr></thead>
            <tbody>
              {filtered.map((maid) => (
                <tr key={maid.id}>
                  <td><div className="person"><Avatar name={maid.name} size="sm" /><div><strong>{maid.name}</strong><small>{maid.source}</small></div></div></td>
                  <td><a href={`tel:${maid.phone}`}>{maid.phone}</a></td>
                  <td className="muted">{maid.age || "Not recorded"}</td>
                  <td><span className="company-cell"><MapPin size={12} />{maid.location || "Not recorded"}</span></td>
                  <td>{maid.serviceTypes}</td>
                  <td><Status value={maid.availability || "Not confirmed"} /></td>
                  <td className="muted">{maid.workNotes || maid.verificationNote || "—"}</td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => openEdit(maid)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mobile-only mobile-list">
          {filtered.map((maid) => <div key={maid.id} className="mobile-row">
            <div className="mobile-row-top"><div className="person"><Avatar name={maid.name} size="sm" /><div><strong>{maid.name}</strong><small>{maid.phone}</small></div></div><Status value={maid.availability || "Not confirmed"} /></div>
            <div className="mobile-row-meta"><span>{maid.location || "Location not recorded"}</span><span>{maid.serviceTypes}</span></div>
            <div className="mobile-row-actions"><button className="btn btn-secondary btn-sm" onClick={() => openEdit(maid)}>Edit profile</button></div>
          </div>)}
        </div>
        {!filtered.length && <Empty title="No maid profiles found" detail="Add a maid or adjust your search and availability filter." />}
      </Card>
      {editing !== false && <Modal
        title={editing ? "Edit staff profile" : "Add staff profile"}
        subtitle="Record only the information needed to match a worker to a service request. Identity documents can be reviewed separately and stored securely."
        onClose={close}
        wide
        footer={<><button className="btn btn-secondary" onClick={close}>Cancel</button><button className="btn btn-primary" type="submit" form="maid-form" disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Add staff member"}</button></>}
      >
        <form id="maid-form" className="form-grid" onSubmit={submit}>
          <Field label="Full name" required><input value={form.name} onChange={(event) => set("name", event.target.value)} required autoFocus placeholder="Staff member / worker name" /></Field>
          <Field label="Phone number" required><input value={form.phone} onChange={(event) => set("phone", event.target.value)} required type="tel" placeholder="+91..." /></Field>
          <Field label="Age"><input value={form.age} onChange={(event) => set("age", event.target.value)} inputMode="numeric" placeholder="Optional" /></Field>
          <Field label="Base location"><input value={form.location} onChange={(event) => set("location", event.target.value)} placeholder="Area / town" /></Field>
          <Field label="Services / skills"><input value={form.serviceTypes} onChange={(event) => set("serviceTypes", event.target.value)} placeholder="House cleaning, cooking, child care..." /></Field>
          <Field label="Availability"><select value={form.availability} onChange={(event) => set("availability", event.target.value)}><option>Not confirmed</option><option>Available</option><option>Available part-time</option><option>Available full-time</option><option>Not available</option><option>On placement</option></select></Field>
          <div className="field full"><span className="field-label">Work notes / restrictions</span><textarea value={form.workNotes} onChange={(event) => set("workNotes", event.target.value)} rows={3} placeholder="Preferred work area, travel limits, experience..." /></div>
        </form>
      </Modal>}
    </div>
  );
}
