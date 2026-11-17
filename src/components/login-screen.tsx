"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Compass, LockKeyhole, Mountain, ShieldCheck, Sparkles } from "lucide-react";

function Brand() {
  return <div className="brand"><span className="brand-mark"><Mountain size={17} strokeWidth={2.2} /></span><span className="brand-text">The Adventure Pinnacle</span></div>;
}

export default function LoginScreen() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Sign in failed. Check your details and try again.");
      window.location.assign("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <section className="login-story">
        <Brand />
        <div className="login-copy">
          <p className="eyebrow">YOUR HOME-STAFFING BUSINESS, ORGANIZED</p>
          <h1>Every client.<br />Every maid.<br />One clear picture.</h1>
          <p>Manage client requests, maid profiles, availability, placements, schedules and payments in one private workspace.</p>
          <div className="login-points">
            <div className="login-point"><span><Compass size={13} /></span><strong>Service requests</strong><small>Capture every client requirement</small></div>
            <div className="login-point"><span><Mountain size={13} /></span><strong>Maid directory</strong><small>Track skills and availability</small></div>
            <div className="login-point"><span><ShieldCheck size={13} /></span><strong>Placement tracking</strong><small>From enquiry to placement</small></div>
          </div>
        </div>
        <p className="login-foot">HOMIGO · Private agency workspace</p>
      </section>
      <section className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="login-mobile-brand"><Brand /><span className="badge badge-yellow">CRM</span></div>
          <div className="login-form-head">
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Sign in to your CRM</h2>
            <p>This workspace is private. Use your owner login details to continue.</p>
          </div>
          <label className="field"><span className="field-label">Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
          <label className="field"><span className="field-label">Password</span><div className="input-lock"><LockKeyhole size={14} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="btn btn-primary login-submit" disabled={loading || !username.trim() || !password}>
            {loading ? <span className="spinner" /> : <><Sparkles size={15} /> Sign in <ArrowRight size={14} /></>}
          </button>
          <p className="login-note">Protected owner access · Session expires automatically</p>
        </form>
      </section>
    </main>
  );
}
