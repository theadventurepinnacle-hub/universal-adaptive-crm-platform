import type { CompanyView, CustomerView, DealView, LeadView, OrganizationView } from "@/lib/crm-types";

export function scoreLead(lead: Pick<LeadView, "id" | "priority" | "source" | "expectedValue" | "nextFollowUp">) {
  let score = 42 + ((lead.id * 7) % 11);
  if (lead.priority === "High") score += 24;
  else if (lead.priority === "Medium") score += 12;
  if (["Referral", "Website", "Google"].includes(lead.source)) score += 8;
  if (["Instagram", "WhatsApp", "Property portal"].includes(lead.source)) score += 5;
  if (lead.expectedValue >= 100000) score += 9;
  else if (lead.expectedValue >= 40000) score += 5;
  if (lead.nextFollowUp) {
    score += new Date(lead.nextFollowUp).getTime() > Date.now() ? 4 : 8;
  } else {
    score -= 9;
  }
  return Math.max(18, Math.min(98, score));
}

export function deriveCompanies(customers: CustomerView[], deals: DealView[], organization: OrganizationView): CompanyView[] {
  const map = new Map<string, CompanyView>();
  const keyOf = (value: string) => value.trim().toLowerCase();
  const initials = (value: string) =>
    value
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  for (const customer of customers) {
    const name = (customer.company || customer.name).trim();
    if (!name) continue;
    const existing = map.get(keyOf(name));
    if (existing) {
      existing.contacts += 1;
    } else {
      map.set(keyOf(name), {
        id: keyOf(name).replace(/[^a-z0-9]+/g, "-"),
        name,
        initials: initials(name),
        contacts: 1,
        openDeals: 0,
        value: 0,
        owner: customer.owner,
        location: organization.country,
        industry: organization.industry,
        status: "Active",
      });
    }
  }

  for (const deal of deals) {
    const name = (deal.company || deal.contact).trim();
    if (!name) continue;
    const existing = map.get(keyOf(name));
    if (existing) {
      existing.openDeals += 1;
      existing.value += deal.value;
      existing.status = "Active";
    } else {
      map.set(keyOf(name), {
        id: keyOf(name).replace(/[^a-z0-9]+/g, "-"),
        name,
        initials: initials(name),
        contacts: 1,
        openDeals: 1,
        value: deal.value,
        owner: deal.owner,
        location: organization.country,
        industry: organization.industry,
        status: "Active",
      });
    }
  }

  return [...map.values()]
    .map((company) => (company.openDeals > 0 ? company : { ...company, status: company.contacts > 1 ? "Active" : "Prospect" }))
    .sort((a, b) => b.value - a.value);
}
