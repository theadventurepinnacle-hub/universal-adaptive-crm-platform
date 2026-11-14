"use client";

import { Check, ChevronDown, Download, Search, X } from "lucide-react";
import type { ReactNode } from "react";

export function money(value: number, compact = true) {
  if (compact && value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(value % 10_000_000 ? 1 : 0)}Cr`;
  if (compact && value >= 100_000) return `₹${(value / 100_000).toFixed(value % 100_000 ? 1 : 0)}L`;
  if (compact && value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string | null, withTime = false) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", withTime
    ? { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function shortDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const tone = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
  return <span className={`avatar avatar-${size} avatar-tone-${tone}`}>{initials(name)}</span>;
}

const statusTones: Record<string, string> = {
  active: "mint", vip: "yellow", inactive: "gray", new: "blue", prospect: "lilac",
  paid: "mint", completed: "mint", won: "mint", accepted: "mint", issued: "mint",
  overdue: "coral", lost: "coral", high: "coral", urgent: "coral", cancelled: "coral",
  pending: "yellow", sent: "yellow", viewed: "yellow", "due soon": "yellow", followup: "yellow",
  draft: "gray", open: "blue", contact: "blue", qualified: "blue",
  negotiation: "lilac", proposal: "lilac", booked: "lilac",
};

export function Status({ value, dot = true }: { value: string; dot?: boolean }) {
  const tone = statusTones[value.toLowerCase()] ?? "gray";
  return <span className={`badge badge-${tone}`}>{dot && <i className="dot" />}{value}</span>;
}

export function Priority({ value }: { value: string }) {
  return <span className={`priority priority-${value.toLowerCase()}`}><i />{value}</span>;
}

export function Score({ value }: { value: number }) {
  const tone = value >= 75 ? "hot" : value >= 50 ? "warm" : "cold";
  const label = tone === "hot" ? "Hot" : tone === "warm" ? "Warm" : "Cold";
  return (
    <span className={`score score-${tone}`} title={`Lead score ${value}/100`}>
      <span className="score-num">{value}</span>
      <span className="score-bar"><i style={{ width: `${value}%` }} /></span>
      <span className="score-label">{label}</span>
    </span>
  );
}

export function PageHead({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">{subtitle}</p>
      </div>
      {actions && <div className="head-actions">{actions}</div>}
    </header>
  );
}

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <section className={`card ${pad ? "card-pad" : ""} ${className}`}>{children}</section>;
}

export function CardHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="card-head">
      <div>
        <h2 className="card-title">{title}</h2>
        {subtitle && <p className="card-sub">{subtitle}</p>}
      </div>
      {actions && <div className="card-head-actions">{actions}</div>}
    </div>
  );
}

export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty">
      <span><Search size={19} /></span>
      <p>{title}</p>
      <small>{detail}</small>
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, footer, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return (
    <div className="overlay">
      <button className="overlay-scrim" onClick={onClose} aria-label="Close dialog" />
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={17} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </section>
    </div>
  );
}

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required && <i> *</i>}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

export function SelectField({ value, onChange, options, ariaLabel }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; ariaLabel: string }) {
  return (
    <span className="select-field">
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown size={13} />
    </span>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (tab: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => <button key={tab} role="tab" aria-selected={value === tab} onClick={() => onChange(tab)} className={value === tab ? "active" : ""}>{tab}</button>)}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button type="button" className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked} aria-label={label}>
      <span>{checked && <Check size={10} />}</span>
    </button>
  );
}

export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ onClick }: { onClick: () => void }) {
  return <button className="btn btn-secondary btn-sm" onClick={onClick}><Download size={14} /> Export</button>;
}
