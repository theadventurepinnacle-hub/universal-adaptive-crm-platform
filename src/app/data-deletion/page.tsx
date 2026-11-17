import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Requests | HOMIGO",
  description: "Instructions for requesting deletion of personal information held by HOMIGO.",
};

const steps = [
  "Contact HOMIGO using the official WhatsApp Business account, Facebook Page or Instagram account you used to contact us.",
  "Write “Data deletion request” and identify the phone number or social media account associated with your enquiry or worker profile.",
  "Tell us whether the request relates to a client enquiry, a maid / worker profile, a service placement or messages sent to our business.",
  "We may ask for reasonable information to verify that you control the account or record before processing the request.",
];

export default function DataDeletionPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#172033", padding: "48px 20px" }}>
      <article style={{ maxWidth: 820, margin: "0 auto", background: "#fff", border: "1px solid #e4e9f0", borderRadius: 20, padding: "clamp(24px, 5vw, 56px)", boxShadow: "0 12px 40px rgba(20, 35, 60, 0.06)" }}>
        <p style={{ margin: 0, color: "#52637a", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>HOMIGO · Privacy</p>
        <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.12, letterSpacing: "-0.035em" }}>Request deletion of your data</h1>
        <p style={{ margin: 0, color: "#66758a", fontSize: 14 }}>Last updated: 17 November 2026</p>
        <p style={{ margin: "28px 0", fontSize: 16, lineHeight: 1.8, color: "#3b4a60" }}>
          You may request deletion of personal information that HOMIGO holds about you, including information received through WhatsApp, Instagram, Facebook Lead Ads or our service enquiry records.
        </p>
        <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>How to request deletion</h2>
        <ol style={{ margin: 0, paddingLeft: 22, display: "grid", gap: 14 }}>
          {steps.map((step) => <li key={step} style={{ paddingLeft: 6, fontSize: 15, lineHeight: 1.8, color: "#3b4a60" }}>{step}</li>)}
        </ol>
        <section style={{ marginTop: 32, padding: 20, borderRadius: 14, background: "#f5f7fb", border: "1px solid #e4e9f0" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>What happens next?</h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "#3b4a60" }}>
            HOMIGO will review your request and may contact you to verify it. We will delete or de-identify information that we no longer need, subject to any information we must retain for legal, accounting, security or legitimate business record purposes. If some information must be retained, we will explain the reason where applicable.
          </p>
        </section>
        <p style={{ margin: "28px 0 0", fontSize: 14, lineHeight: 1.8, color: "#66758a" }}>
          Please do not send passwords, payment card details or sensitive identity documents in a social media message. See the <a href="/privacy-policy" style={{ color: "#2563eb", textDecoration: "underline" }}>HOMIGO Privacy Policy</a> for more information about how we handle personal data.
        </p>
      </article>
    </main>
  );
}
