"use client";

import { useMemo, useState } from "react";
import type { WorkspaceData } from "@/lib/crm-types";
import { Avatar, Card, Empty, PageHead, Status } from "@/components/ui";
import { CalendarDays, Check, Clock3, FileSpreadsheet, MapPin, Users } from "lucide-react";

type Draft = { status: string; checkIn: string; checkOut: string; notes: string };

const statuses = ["Present", "Absent", "Leave", "Weekly Off", "Holiday"];

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function AttendanceView({ data, onSave }: {
  data: WorkspaceData;
  onSave: (payload: Record<string, unknown>, success: string) => Promise<boolean>;
}) {
  const [workDate, setWorkDate] = useState(todayKey);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const placements = useMemo(() => data.deals
    .filter((deal) => {
      if (!deal.maidId) return false;
      if (deal.startAt && deal.startAt.slice(0, 10) > workDate) return false;
      const status = (deal.placementStatus || deal.stage).toLowerCase();
      return !status.includes("cancel") && !status.includes("completed") && !status.includes("closed");
    })
    .sort((a, b) => (a.maidName || "").localeCompare(b.maidName || "")),
  [data.deals, workDate]);

  const draftFor = (placementId: number): Draft => {
    const edited = drafts[placementId];
    if (edited) return edited;
    const saved = data.attendance.find((item) => item.placementId === placementId && item.workDate === workDate);
    return {
      status: saved?.status || "",
      checkIn: saved?.checkIn || "",
      checkOut: saved?.checkOut || "",
      notes: saved?.notes || "",
    };
  };

  const setDraft = (placementId: number, patch: Partial<Draft>) => {
    setDrafts((current) => ({
      ...current,
      [placementId]: { ...draftFor(placementId), ...patch },
    }));
  };

  const counts = useMemo(() => {
    const rows = placements.map((placement) => draftFor(placement.id));
    return {
      present: rows.filter((row) => row.status === "Present").length,
      absent: rows.filter((row) => row.status === "Absent").length,
      leave: rows.filter((row) => row.status === "Leave").length,
      unmarked: rows.filter((row) => !row.status).length,
    };
  }, [placements, data.attendance, workDate, drafts]);

  const save = async (placement: typeof data.deals[number]) => {
    if (!placement.maidId) return;
    const draft = draftFor(placement.id);
    if (!draft.status) return;
    setSavingId(placement.id);
    const ok = await onSave({
      action: "saveAttendance",
      placementId: placement.id,
      maidId: placement.maidId,
      workDate,
      status: draft.status,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      notes: draft.notes,
    }, `${placement.maidName || "Maid"} attendance saved`);
    setSavingId(null);
    if (ok) setDrafts((current) => {
      const next = { ...current };
      delete next[placement.id];
      return next;
    });
  };

  const exportCsv = () => {
    const rows = [
      ["Date", "Maid", "Client", "Placement", "Schedule", "Status", "Check-in", "Check-out", "Notes"],
      ...placements.map((placement) => {
        const draft = draftFor(placement.id);
        return [workDate, placement.maidName || "", placement.contact || "", placement.title, placement.schedule || "", draft.status || "Not marked", draft.checkIn, draft.checkOut, draft.notes];
      }),
    ];
    const content = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `homigo-attendance-${workDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <PageHead
        eyebrow="HOMIGO · WORKFORCE"
        title="Attendance & Schedule"
        subtitle="Daily attendance for placed maids, with client, shift and check-in details."
        actions={<button className="btn btn-secondary" onClick={exportCsv} disabled={!placements.length}><FileSpreadsheet size={15} /> Export day</button>}
      />
      <div className="summary-row">
        <div className="summary-card"><span className="summary-icon mint"><Users size={16} /></span><div><small>Placed maids</small><strong>{placements.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon mint"><Check size={16} /></span><div><small>Present</small><strong>{counts.present}</strong></div></div>
        <div className="summary-card"><span className="summary-icon peach"><Clock3 size={16} /></span><div><small>Absent / leave</small><strong>{counts.absent + counts.leave}</strong></div></div>
        <div className="summary-card"><span className="summary-icon yellow"><CalendarDays size={16} /></span><div><small>Not marked</small><strong>{counts.unmarked}</strong></div></div>
      </div>
      <Card>
        <div className="setting-row">
          <div><strong>Attendance date</strong><small>Choose the work date to record or update each placement's attendance.</small></div>
          <input className="field-input" aria-label="Attendance date" type="date" value={workDate} onChange={(event) => { setWorkDate(event.target.value); setDrafts({}); }} />
        </div>
        <p className="muted-note">Only placements with an assigned maid and a start date on or before the selected day are listed. Cancelled and completed placements are hidden.</p>
      </Card>
      <Card pad={false}>
        <div className="table-toolbar">
          <div className="toolbar-actions"><span className="badge badge-gray">{placements.length} active placements</span><span className="muted-note">Attendance changes are saved per maid and date.</span></div>
        </div>
        {placements.length ? (
          <>
            <div className="table-wrap desktop-only">
              <table className="data-table">
                <thead><tr><th>Maid / worker</th><th>Client</th><th>Shift</th><th>Status</th><th>Check-in</th><th>Check-out</th><th>Notes</th><th /></tr></thead>
                <tbody>
                  {placements.map((placement) => {
                    const draft = draftFor(placement.id);
                    return <tr key={placement.id}>
                      <td><div className="person"><Avatar name={placement.maidName || "Maid"} size="sm" /><div><strong>{placement.maidName || "Maid"}</strong><small>{placement.title}</small></div></div></td>
                      <td>{placement.contact}</td>
                      <td className="muted">{placement.schedule || "To be confirmed"}</td>
                      <td><select aria-label={`Attendance status for ${placement.maidName}`} value={draft.status} onChange={(event) => setDraft(placement.id, { status: event.target.value })}><option value="">Not marked</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
                      <td><input aria-label="Check-in time" type="time" value={draft.checkIn} onChange={(event) => setDraft(placement.id, { checkIn: event.target.value })} /></td>
                      <td><input aria-label="Check-out time" type="time" value={draft.checkOut} onChange={(event) => setDraft(placement.id, { checkOut: event.target.value })} /></td>
                      <td><input aria-label="Attendance notes" value={draft.notes} onChange={(event) => setDraft(placement.id, { notes: event.target.value })} placeholder="Optional" /></td>
                      <td><button className="btn btn-primary btn-sm" disabled={!draft.status || savingId === placement.id} onClick={() => void save(placement)}>{savingId === placement.id ? "Saving..." : "Save"}</button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="mobile-only mobile-list">
              {placements.map((placement) => {
                const draft = draftFor(placement.id);
                return <div className="mobile-row" key={placement.id}>
                  <div className="mobile-row-top"><div className="person"><Avatar name={placement.maidName || "Maid"} size="sm" /><div><strong>{placement.maidName || "Maid"}</strong><small>{placement.contact}</small></div></div><Status value={draft.status || "Not marked"} /></div>
                  <div className="mobile-row-meta"><span>{placement.schedule || "Shift not recorded"}</span><span>{placement.title}</span></div>
                  <div className="form-grid">
                    <label className="field"><span className="field-label">Attendance status</span><select value={draft.status} onChange={(event) => setDraft(placement.id, { status: event.target.value })}><option value="">Not marked</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="field"><span className="field-label">Check-in</span><input type="time" value={draft.checkIn} onChange={(event) => setDraft(placement.id, { checkIn: event.target.value })} /></label>
                    <label className="field"><span className="field-label">Check-out</span><input type="time" value={draft.checkOut} onChange={(event) => setDraft(placement.id, { checkOut: event.target.value })} /></label>
                  </div>
                  <div className="mobile-row-actions"><button className="btn btn-primary btn-sm" disabled={!draft.status || savingId === placement.id} onClick={() => void save(placement)}>{savingId === placement.id ? "Saving..." : "Save attendance"}</button></div>
                </div>;
              })}
            </div>
          </>
        ) : <Empty title="No active maid placements for this date" detail="Create a placement and assign a maid first. Its schedule will appear here automatically." />}
      </Card>
    </div>
  );
}
