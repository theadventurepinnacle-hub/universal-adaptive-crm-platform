import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | The Adventure Pinnacle",
  description: "How The Adventure Pinnacle handles information received through WhatsApp, Instagram, Facebook Lead Ads and its travel enquiry CRM.",
};

const sections = [
  {
    title: "1. Who we are",
    body: [
      "The Adventure Pinnacle is a travel business based in Kerala, India. This policy explains how we handle personal information when you contact us, enquire about a trip, request a quotation, or interact with our business through Meta services such as WhatsApp, Instagram and Facebook Lead Ads.",
    ],
  },
  {
    title: "2. Information we may collect",
    body: [
      "Depending on how you contact us, we may receive your name, phone number, email address, social media account or sender identifier, the messages and files you send, the date and time of your enquiry, and information you choose to provide about a trip.",
      "Trip information may include destination preferences, intended travel dates, group size, budget, package interest and other details you voluntarily share. For Facebook Lead Ads, we may receive the answers you submit in the lead form.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "We use this information to respond to enquiries, understand your travel requirements, prepare quotations, manage bookings and follow-ups, provide customer support, maintain business records, and improve our services.",
      "Where AI-assisted enquiry qualification is enabled, message text may be processed through Vercel AI Gateway and the AI model configured for our CRM to prepare an internal summary, identify details stated in your message, assign an enquiry priority and suggest a response. Our team can review suggested responses; the AI does not make a booking or guarantee availability or price.",
    ],
  },
  {
    title: "4. How information is shared",
    body: [
      "We do not sell your personal information. We may share relevant information with service providers that help us operate our business and CRM, including Meta when you use its services, Vercel for application hosting and AI Gateway services, Neon for database hosting, and the AI model provider selected in our CRM configuration.",
      "We may also disclose information where required by law, legal process or a valid request from a competent authority, or when necessary to protect our rights, customers or services.",
    ],
  },
  {
    title: "5. International processing",
    body: [
      "Our service providers may process or store information in countries other than India. Where this happens, the information may be subject to the laws of those locations and the service provider's applicable privacy and security terms.",
    ],
  },
  {
    title: "6. Retention and security",
    body: [
      "We keep enquiry and customer information for as long as reasonably necessary to respond to you, manage a potential or completed booking, provide support, maintain business records and meet applicable legal requirements. We take reasonable technical and organisational measures to protect information against unauthorised access, loss, misuse or disclosure.",
      "No online service can be guaranteed to be completely secure. Please avoid sending payment card details, account passwords or other highly sensitive information in social media messages.",
    ],
  },
  {
    title: "7. Your choices and requests",
    body: [
      "You may ask us to access, correct or delete personal information you have provided, or object to a particular use where applicable. To help us locate your records, make the request using the same official WhatsApp, Facebook or Instagram account through which you contacted The Adventure Pinnacle. Tell us which account or phone number you used. We may ask for reasonable information to verify your identity before acting.",
      "Some information may need to be retained where required for legal, accounting, security or legitimate business purposes. We will explain if that limits a deletion request.",
    ],
  },
  {
    title: "8. Third-party platforms",
    body: [
      "When you use WhatsApp, Instagram, Facebook or another third-party service, that platform also processes information under its own terms and privacy policy. The Adventure Pinnacle does not control the privacy practices of those platforms.",
    ],
  },
  {
    title: "9. Changes to this policy",
    body: [
      "We may update this policy when our services or information practices change. The updated version will be published on this page with a revised date.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#172033", padding: "48px 20px" }}>
      <article style={{ maxWidth: 880, margin: "0 auto", background: "#fff", border: "1px solid #e4e9f0", borderRadius: 20, padding: "clamp(24px, 5vw, 56px)", boxShadow: "0 12px 40px rgba(20, 35, 60, 0.06)" }}>
        <p style={{ margin: 0, color: "#52637a", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>The Adventure Pinnacle</p>
        <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.12, letterSpacing: "-0.035em" }}>Privacy Policy</h1>
        <p style={{ margin: 0, color: "#66758a", fontSize: 14 }}>Last updated: 17 November 2026</p>
        <p style={{ margin: "28px 0 32px", fontSize: 16, lineHeight: 1.75, color: "#3b4a60" }}>
          Your privacy matters to us. This policy describes what information The Adventure Pinnacle receives, how we use it, when it may be shared, and how you can make a privacy request.
        </p>
        <div style={{ display: "grid", gap: 26 }}>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 style={{ margin: "0 0 10px", fontSize: 19, lineHeight: 1.35 }}>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} style={{ margin: "0 0 10px", fontSize: 15, lineHeight: 1.8, color: "#3b4a60" }}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
        <section style={{ marginTop: 34, paddingTop: 24, borderTop: "1px solid #e6ebf2" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 19 }}>Contact for privacy requests</h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: "#3b4a60" }}>
            Contact The Adventure Pinnacle through the official WhatsApp Business account, Facebook Page or Instagram account that you used to contact us. Please identify the account or phone number associated with your enquiry and state your request.
          </p>
        </section>
      </article>
    </main>
  );
}
