import { deriveCompanies, scoreLead } from "@/lib/derive";
import type {
  IndustryKey,
  IndustryProfile,
  WorkspaceData,
} from "@/lib/crm-types";

const atDay = (offset: number, hour = 10, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const industryProfiles: Record<IndustryKey, IndustryProfile> = {
  insurance: {
    label: "Insurance",
    eyebrow: "Protection & renewals",
    leadLabel: "Prospect",
    leadPlural: "Prospects",
    customerLabel: "Policyholder",
    customerPlural: "Policyholders",
    productLabel: "Policy",
    pipelineName: "Policy Sales",
    modules: [
      { label: "Policies", icon: "shield" },
      { label: "Renewals", icon: "refresh" },
      { label: "Claims", icon: "file" },
      { label: "Premiums", icon: "wallet" },
    ],
    customFields: [
      { label: "Policy type", key: "policyType" },
      { label: "Coverage need", key: "coverage" },
      { label: "Renewal date", key: "renewalDate" },
    ],
    sources: ["Referral", "WhatsApp", "Website", "Phone", "Walk-in", "Advertisement"],
    attention: [
      { severity: "critical", count: "7", title: "prospects have no next follow-up", detail: "₹4.8L in potential premium is at risk", action: "Assign follow-ups" },
      { severity: "critical", count: "₹2.4L", title: "premium payments are overdue", detail: "Across 9 active policyholders", action: "View payments" },
      { severity: "warning", count: "12", title: "renewals are due in the next 14 days", detail: "4 are high-value policies", action: "Start renewal calls" },
      { severity: "notice", count: "4", title: "quotes are waiting for a response", detail: "No customer activity for 3+ days", action: "Review quotes" },
    ],
    insights: [
      { title: "Referrals convert best", detail: "42% conversion this month — 1.8× higher than paid ads.", tone: "green" },
      { title: "Renewal opportunity", detail: "₹3.6L in premiums can be retained over the next 30 days.", tone: "blue" },
      { title: "Follow-up gap", detail: "Prospects contacted within 24 hours convert 27% more often.", tone: "amber" },
    ],
    chart: [
      { label: "Mon", value: 135000 }, { label: "Tue", value: 190000 }, { label: "Wed", value: 155000 },
      { label: "Thu", value: 265000 }, { label: "Fri", value: 235000 }, { label: "Sat", value: 320000 },
      { label: "Sun", value: 285000 },
    ],
  },
  "real-estate": {
    label: "Real Estate",
    eyebrow: "Properties & bookings",
    leadLabel: "Property Lead",
    leadPlural: "Property Leads",
    customerLabel: "Buyer",
    customerPlural: "Buyers",
    productLabel: "Property",
    pipelineName: "Property Sales",
    modules: [
      { label: "Properties", icon: "building" },
      { label: "Site Visits", icon: "calendar" },
      { label: "Bookings", icon: "key" },
      { label: "Units", icon: "grid" },
    ],
    customFields: [
      { label: "Property type", key: "propertyType" },
      { label: "Budget", key: "budget" },
      { label: "Preferred location", key: "location" },
    ],
    sources: ["Instagram", "Property portal", "Website", "Referral", "Walk-in", "Advertisement"],
    attention: [
      { severity: "critical", count: "5", title: "hot property leads have no next action", detail: "Combined budget of ₹4.2Cr", action: "Assign follow-ups" },
      { severity: "critical", count: "₹18L", title: "booking payments are overdue", detail: "Across 3 reserved units", action: "View payments" },
      { severity: "warning", count: "8", title: "site visits need confirmation", detail: "Scheduled over the next 3 days", action: "Confirm visits" },
      { severity: "notice", count: "6", title: "leads have gone quiet", detail: "No response after a site visit", action: "Start re-engagement" },
    ],
    insights: [
      { title: "Instagram is your top source", detail: "It generated 38% of qualified property leads this month.", tone: "green" },
      { title: "Site visits drive bookings", detail: "Leads completing a visit are 3.4× more likely to book.", tone: "blue" },
      { title: "Response time increased", detail: "Average first response is now 3h 12m, up by 48 minutes.", tone: "amber" },
    ],
    chart: [
      { label: "Mon", value: 2800000 }, { label: "Tue", value: 4100000 }, { label: "Wed", value: 3600000 },
      { label: "Thu", value: 5900000 }, { label: "Fri", value: 4800000 }, { label: "Sat", value: 7200000 },
      { label: "Sun", value: 6500000 },
    ],
  },
  retail: {
    label: "Retail",
    eyebrow: "Orders & inventory",
    leadLabel: "Sales Inquiry",
    leadPlural: "Sales Inquiries",
    customerLabel: "Customer",
    customerPlural: "Customers",
    productLabel: "Product",
    pipelineName: "Bulk & B2B Sales",
    modules: [
      { label: "Products", icon: "package" },
      { label: "Inventory", icon: "boxes" },
      { label: "Orders", icon: "bag" },
      { label: "Suppliers", icon: "truck" },
    ],
    customFields: [
      { label: "Product interest", key: "productInterest" },
      { label: "Order quantity", key: "quantity" },
      { label: "Preferred store", key: "store" },
    ],
    sources: ["Walk-in", "Instagram", "WhatsApp", "Website", "Google", "Referral"],
    attention: [
      { severity: "critical", count: "9", title: "orders are waiting for confirmation", detail: "₹1.6L in open order value", action: "Review orders" },
      { severity: "critical", count: "₹86K", title: "customer payments are overdue", detail: "Across 6 wholesale customers", action: "View payments" },
      { severity: "warning", count: "14", title: "products are running low on stock", detail: "5 are top-selling items", action: "Check inventory" },
      { severity: "notice", count: "23", title: "customers have been inactive for 60 days", detail: "Potential repeat-purchase opportunity", action: "Create campaign" },
    ],
    insights: [
      { title: "WhatsApp orders are growing", detail: "Order value from WhatsApp is up 23% this month.", tone: "green" },
      { title: "Repeat buyers spend more", detail: "Returning customers have a 31% higher average order value.", tone: "blue" },
      { title: "Stock-out risk", detail: "Classic Linen Shirt may sell out within 4 days.", tone: "amber" },
    ],
    chart: [
      { label: "Mon", value: 92000 }, { label: "Tue", value: 128000 }, { label: "Wed", value: 115000 },
      { label: "Thu", value: 176000 }, { label: "Fri", value: 164000 }, { label: "Sat", value: 238000 },
      { label: "Sun", value: 205000 },
    ],
  },
};

export const demoOrganizations = [
  { slug: "insurance" as const, name: "SecureLife Advisory", industry: "Insurance", accent: "#2f6fed" },
  { slug: "real-estate" as const, name: "Horizon Realty", industry: "Real Estate", accent: "#e76f35" },
  { slug: "retail" as const, name: "Northstar Retail", industry: "Retail", accent: "#198f70" },
];

const config = {
  insurance: {
    org: { id: 1, name: "SecureLife Advisory", slug: "insurance" as const, industry: "Insurance", currency: "INR", country: "India", employees: 12, locations: 2, accent: "#2f6fed" },
    stages: ["New prospect", "Requirement collected", "Quote sent", "Follow-up", "Policy issued", "Lost"],
    stageColors: ["#8290a5", "#7c6ee6", "#2f6fed", "#e99a2f", "#1f9d77", "#dc5a67"],
    people: [
      ["Arjun Menon", "Bright Foods Pvt Ltd", "+91 98470 23104", "arjun@brightfoods.in", "Referral", "High", 85000, 2, "Life cover", "₹1 crore", "Sep 18, 2026"],
      ["Meera Nair", "Nair & Co.", "+91 98765 11220", "meera@nairco.in", "WhatsApp", "High", 42000, 3, "Health family floater", "₹25 lakh", "Nov 02, 2026"],
      ["Nihal Thomas", "", "+91 94474 63081", "nihal.t@gmail.com", "Website", "Medium", 28500, 1, "Motor comprehensive", "₹18 lakh IDV", "Jan 12, 2027"],
      ["Fathima Rahman", "Raheem Exports", "+91 98950 77215", "fathima@raheemexport.com", "Phone", "High", 125000, 4, "Group health", "35 employees", "Oct 28, 2026"],
      ["Devika Pillai", "", "+91 80893 45619", "devika.p@gmail.com", "Instagram", "Low", 18000, 0, "Term insurance", "₹75 lakh", "Dec 04, 2026"],
      ["Ramesh Kumar", "Kumar Stores", "+91 99954 81006", "ramesh@kumarstores.in", "Walk-in", "Medium", 36000, 5, "Shop insurance", "₹40 lakh", "Aug 30, 2026"],
    ],
    customerNames: ["Sanjay Krishnan", "Lakshmi Textiles", "Aisha Mohammed", "Vivek George", "Anand Krishnan", "Zainab Ali", "Sreekumar Nair", "Tara Varghese", "Prakash Iyer", "Lena Fernandes"],
    customerMeta: [
      ["Life Shield Plus", "POL-24819", "Sep 18, 2026"], ["Business Secure", "POL-19204", "Nov 02, 2026"],
      ["Family Health Max", "POL-30448", "Oct 11, 2026"], ["Motor Protect", "POL-28751", "Dec 22, 2026"],
      ["Family Health Max", "POL-31902", "Nov 14, 2026"], ["Term Life Secure", "POL-20884", "Jan 09, 2027"],
      ["Group Health Plus", "POL-27613", "Oct 30, 2026"], ["Motor Shield", "POL-33277", "Dec 18, 2026"],
      ["Business Guard", "POL-19448", "Sep 26, 2026"], ["Travel Secure", "POL-30117", "Feb 02, 2027"],
    ],
  },
  "real-estate": {
    org: { id: 2, name: "Horizon Realty", slug: "real-estate" as const, industry: "Real Estate", currency: "INR", country: "India", employees: 18, locations: 3, accent: "#e76f35" },
    stages: ["New lead", "Contacted", "Site visit", "Negotiation", "Booking", "Closed"],
    stageColors: ["#8290a5", "#7c6ee6", "#2f6fed", "#e99a2f", "#20a578", "#1f9d77"],
    people: [
      ["Rahul Varma", "", "+91 98951 10234", "rahul.v@gmail.com", "Instagram", "High", 8500000, 2, "3 BHK Apartment", "₹80L–₹95L", "Kakkanad"],
      ["Anjali Mathew", "Vertex Labs", "+91 97462 88410", "anjali@vertexlabs.io", "Property portal", "High", 12500000, 3, "Villa", "₹1.1Cr–₹1.4Cr", "Thrippunithura"],
      ["Mohammed Faizal", "", "+91 80898 16044", "faizal.m@gmail.com", "Referral", "Medium", 6200000, 1, "2 BHK Apartment", "₹55L–₹68L", "Edappally"],
      ["Neethu Joseph", "", "+91 94471 33528", "neethu.j@gmail.com", "Website", "High", 9800000, 4, "3 BHK Apartment", "₹90L–₹1.05Cr", "Vyttila"],
      ["Thomas Kurian", "Kurian Holdings", "+91 98460 72912", "thomas@kurianholdings.in", "Walk-in", "Medium", 18000000, 0, "Commercial Space", "₹1.5Cr–₹2Cr", "MG Road"],
      ["Priya Nandakumar", "", "+91 79074 12980", "priya.n@gmail.com", "Advertisement", "Low", 4800000, 5, "1 BHK Apartment", "₹42L–₹50L", "Aluva"],
    ],
    customerNames: ["Rohan Nambiar", "Nexa Consulting", "Sara Jacob", "Abdul Kareem", "Anitha Suresh", "Geo Builders", "Sameer Khan", "Megha Rose", "Joseph Chacko", "Trisha Iyer"],
    customerMeta: [
      ["3 BHK Apartment", "Skyline A-1204", "Kakkanad"], ["Office Space", "Commerce 8F", "MG Road"],
      ["Villa", "Palm Grove V-18", "Thrippunithura"], ["2 BHK Apartment", "Marina B-602", "Vyttila"],
      ["2 BHK Apartment", "Marina C-411", "Vyttila"], ["Commercial Shop", "Market G-04", "MG Road"],
      ["3 BHK Apartment", "Skyline A-808", "Kakkanad"], ["Villa", "Palm Grove V-27", "Thrippunithura"],
      ["Office Space", "Commerce 3B", "Kakkanad"], ["1 BHK Apartment", "Marina A-102", "Aluva"],
    ],
  },
  retail: {
    org: { id: 3, name: "Northstar Retail", slug: "retail" as const, industry: "Retail", currency: "INR", country: "India", employees: 24, locations: 4, accent: "#198f70" },
    stages: ["New inquiry", "Qualified", "Quote shared", "Order confirmed", "Dispatched", "Completed"],
    stageColors: ["#8290a5", "#7c6ee6", "#2f6fed", "#e99a2f", "#20a578", "#1f9d77"],
    people: [
      ["Kiran Rao", "Bluebird Café", "+91 98861 23410", "kiran@bluebirdcafe.in", "WhatsApp", "High", 68000, 2, "Ceramic dinner set", "80 sets", "Indiranagar"],
      ["Sneha Kapoor", "Studio Nine", "+91 99002 77184", "sneha@studionine.in", "Instagram", "Medium", 42000, 1, "Linen shirts", "60 pcs", "Koramangala"],
      ["Ajay Shah", "Shah Distributors", "+91 98450 33910", "ajay@shahdistributors.com", "Referral", "High", 185000, 3, "Mixed homeware", "240 units", "Central Store"],
      ["Divya Menon", "", "+91 80888 12042", "divya.m@gmail.com", "Website", "Low", 12500, 0, "Storage baskets", "12 units", "Whitefield"],
      ["Manoj Bhat", "Cedar Hotel", "+91 99860 55271", "manoj@cedarhotel.in", "Walk-in", "High", 96000, 4, "Premium towels", "150 pcs", "Central Store"],
      ["Reema Joseph", "Reema Gifts", "+91 78925 60314", "reema@reemagifts.in", "Google", "Medium", 34000, 5, "Gift hampers", "35 units", "Jayanagar"],
    ],
    customerNames: ["Maya Boutique", "Copper Kitchen", "Joel D'Souza", "Urban Nest Décor", "Nandini Stores", "Arjun Pillai", "Bloom Decor", "Sameera Ali", "Fresh Mart", "Deepak Verma"],
    customerMeta: [
      ["Classic Linen Shirt", "120 pcs", "Central Store"], ["Ceramic Serveware", "64 sets", "Indiranagar"],
      ["Home storage", "18 units", "Whitefield"], ["Mixed décor", "95 units", "Jayanagar"],
      ["Ceramic dinner sets", "24 sets", "Jayanagar"], ["Linen shirts", "18 pcs", "Koramangala"],
      ["Décor hampers", "12 units", "Indiranagar"], ["Storage baskets", "30 units", "Whitefield"],
      ["Premium towels", "45 pcs", "Central Store"], ["Candle sets", "20 units", "Whitefield"],
    ],
  },
};

export function getFallbackWorkspace(industry: IndustryKey = "insurance"): WorkspaceData {
  const source = config[industry];
  const profile = industryProfiles[industry];
  const base = source.org.id * 1000;
  const teamNames = industry === "insurance"
    ? [["Nisha Pillai", "Owner", "Founder & CEO"], ["Rahul Das", "Manager", "Sales Manager"], ["Amina Shah", "Employee", "Relationship Advisor"], ["Joel Mathew", "Employee", "Renewal Executive"]]
    : industry === "real-estate"
      ? [["Aarav Nair", "Owner", "Managing Director"], ["Diya George", "Manager", "Sales Manager"], ["Vishnu Raj", "Employee", "Property Advisor"], ["Hiba Khan", "Employee", "Client Partner"]]
      : [["Riya Sen", "Owner", "Founder"], ["Vikram Joshi", "Manager", "Store Operations"], ["Anu Paul", "Employee", "Sales Executive"], ["Kabir Singh", "Employee", "B2B Sales"]];

  const team = teamNames.map((member, index) => ({
    id: base + index + 1,
    name: member[0],
    role: member[1],
    title: member[2],
    avatar: member[0].split(" ").map((part) => part[0]).join("").slice(0, 2),
    leads: [18, 24, 16, 13][index],
    tasksDone: [31, 42, 29, 25][index],
    revenue: (industry === "real-estate" ? 3200000 : industry === "insurance" ? 480000 : 280000) * (4 - index),
    trend: [14, 9, 18, -3][index],
  }));

  const stages = source.stages.map((name, index) => ({
    id: base + 100 + index,
    name,
    color: source.stageColors[index],
    position: index,
    isWon: index === source.stages.length - 2 || (industry !== "insurance" && index === source.stages.length - 1),
    isLost: industry === "insurance" && index === source.stages.length - 1,
  }));

  const leads = source.people.map((person, index) => {
    const id = base + 200 + index;
    const priority = String(person[5]);
    const sourceName = String(person[4]);
    const expectedValue = Number(person[6]);
    const nextFollowUp = index === 5 ? atDay(-2, 11) : atDay(index % 3, 9 + index);
    return {
      id,
      name: String(person[0]), company: String(person[1]), phone: String(person[2]), email: String(person[3]), source: sourceName,
      priority, score: scoreLead({ id, priority, source: sourceName, expectedValue, nextFollowUp }), expectedValue, nextFollowUp,
      notes: index % 2 === 0 ? "Asked for a clear comparison and next steps." : "Prefers WhatsApp updates before a call.",
      stageId: stages[Number(person[7])].id, stage: stages[Number(person[7])].name, stageColor: stages[Number(person[7])].color,
      assignedToId: team[(index % 3) + 1].id, assignee: team[(index % 3) + 1].name, avatar: team[(index % 3) + 1].avatar,
      customData: {
        [profile.customFields[0].key]: String(person[8]), [profile.customFields[1].key]: String(person[9]), [profile.customFields[2].key]: String(person[10]),
      },
      createdAt: atDay(-index, 8 + index),
    };
  });

  const customers = source.customerNames.map((name, index) => ({
    id: base + 300 + index, name, company: index % 2 ? name : "", phone: `+91 98${source.org.id}${index}5 42${index}18`,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`, segment: ["VIP", "Active", "Active", "Inactive", "Active", "New", "VIP", "Active", "Inactive", "Active"][index] ?? "Active",
    totalValue: (industry === "real-estate" ? 7800000 : industry === "insurance" ? 86000 : 54000) * (index + 1),
    owner: team[(index % 3) + 1].name, avatar: name.split(" ").map((part) => part[0]).join("").slice(0, 2),
    customData: {
      [profile.customFields[0].key]: source.customerMeta[index][0], [profile.customFields[1].key]: source.customerMeta[index][1], [profile.customFields[2].key]: source.customerMeta[index][2],
    },
    lastContactAt: atDay(index === 3 ? -64 : -index * 3, 14),
  }));

  const taskTitles = industry === "insurance"
    ? ["Call Arjun about term cover", "Send family health comparison", "Collect KYC documents", "Premium renewal reminder", "Review claim documents", "Prepare corporate quote", "Update policy nomination"]
    : industry === "real-estate"
      ? ["Confirm Rahul's site visit", "Send floor plan to Anjali", "Call Mohammed about budget", "Prepare booking form", "Share unit availability", "Collect booking payment", "Schedule project walkthrough"]
      : ["Confirm Bluebird bulk order", "Share wholesale price list", "Check stock for linen shirts", "Collect pending payment", "Prepare dispatch note", "Call inactive buyer", "Send product catalogue"];
  const tasks = taskTitles.map((title, index) => ({
    id: base + 400 + index, title, type: index === 0 || index === 3 ? "Follow-up" : index === 2 ? "Inventory" : "Task",
    priority: index < 2 ? "High" : index === 5 ? "Low" : "Medium", status: index === 6 ? "completed" : "open", dueAt: atDay(index < 5 ? 0 : index - 4, 9 + index),
    relatedTo: index < leads.length ? leads[index].name : customers[index % customers.length].name,
    assignee: team[(index % 3) + 1].name, assignedToId: team[(index % 3) + 1].id,
  }));

  const amounts = industry === "real-estate" ? [1250000, 860000, 2100000, 475000] : industry === "insurance" ? [68000, 42000, 125000, 36000] : [86000, 54000, 128000, 34000];
  const payments = amounts.map((amount, index) => ({
    id: base + 500 + index, reference: `${industry === "insurance" ? "PREM" : industry === "real-estate" ? "BOOK" : "INV"}-26-${1048 + index}`,
    customer: customers[index].name, description: industry === "insurance" ? `${source.customerMeta[index][0]} premium` : industry === "real-estate" ? `Booking instalment · ${source.customerMeta[index][1]}` : `Order payment · ${source.customerMeta[index][0]}`,
    totalAmount: amount, paidAmount: index === 2 ? amount : index === 1 ? Math.round(amount * 0.5) : 0, dueAt: atDay(index - 2, 17), status: index === 2 ? "Paid" : index < 2 ? "Overdue" : "Due soon",
  }));

  const quotations = leads.slice(0, 3).map((lead, index) => ({
    id: base + 600 + index, quoteNumber: `QT-2026-${112 + index}`, customer: lead.name,
    title: `${lead.customData[profile.customFields[0].key]} proposal`, amount: lead.expectedValue, tax: Math.round(lead.expectedValue * 0.18),
    status: ["Sent", "Viewed", "Accepted"][index], validUntil: atDay(7 + index * 3, 18),
  }));

  const activityTitles = ["Called customer", "Added requirement", "Quotation sent", "WhatsApp message", "Follow-up scheduled", "Payment reminder sent", "Lead created", "Note added"];
  const activities = activityTitles.map((title, index) => ({
    id: base + 700 + index, type: ["call", "note", "quote", "message", "calendar", "payment", "lead", "note"][index], title,
    detail: index === 0 ? "Discussed requirements and agreed on the next step." : index === 2 ? quotations[0].quoteNumber : `Activity recorded for ${leads[index % leads.length].name}`,
    actor: team[(index % 3) + 1].name, customerId: index % 2 === 0 ? customers[index % customers.length].id : null,
    leadId: index % 2 ? leads[index % leads.length].id : null, createdAt: atDay(index < 2 ? 0 : -Math.ceil(index / 2), 15 - (index % 5)),
  }));

  const notifications = [
    ["Follow-ups need attention", `3 ${profile.leadPlural.toLowerCase()} are overdue`, "Open work queue", "urgent"],
    ["New lead assigned", `${leads[0].name} was assigned to you`, "View lead", "info"],
    ["Payment overdue", `${payments[0].reference} passed its due date`, "Send reminder", "warning"],
    ["Quotation viewed", `${leads[1].name} opened your quotation`, "Follow up", "success"],
  ].map((item, index) => ({
    id: base + 800 + index, title: item[0], detail: item[1], actionLabel: item[2], severity: item[3], isRead: index === 3, createdAt: atDay(0, 12 - index),
  }));

  const dealSeeds: Record<IndustryKey, Array<[string, number, number, string, number, number, string]>> = {
    insurance: [
      ["Family health floater", 0, 3, "High", 76, 12, "Referral"],
      ["Business secure renewal", 1, 4, "High", 92, 5, "WhatsApp"],
      ["Term life upgrade", 2, 2, "Medium", 58, 24, "Website"],
      ["Group health · 35 employees", 3, 3, "High", 70, 18, "Phone"],
      ["Motor comprehensive", 0, 1, "Low", 34, 35, "Instagram"],
      ["Shop insurance renewal", 2, 5, "Medium", 100, -3, "Walk-in"],
      ["Keyman cover", 1, 2, "Medium", 55, 27, "Referral"],
      ["Annual travel cover", 3, 0, "Low", 22, 41, "Website"],
    ],
    "real-estate": [
      ["3 BHK · Skyline A-1204", 0, 3, "High", 74, 14, "Instagram"],
      ["Villa booking · Palm Grove V-18", 1, 4, "High", 90, 8, "Referral"],
      ["2 BHK · Marina B-602", 3, 2, "Medium", 48, 26, "Website"],
      ["Office space · Commerce 8F", 1, 3, "High", 66, 20, "Property portal"],
      ["Commercial plot · Kakkanad", 0, 1, "Medium", 32, 38, "Referral"],
      ["3 BHK · Skyline B-803", 2, 2, "Medium", 51, 30, "Instagram"],
      ["Rental mandate · Vyttila", 3, 5, "Low", 100, -6, "Walk-in"],
      ["1 BHK · Aluva", 2, 0, "Low", 18, 45, "Advertisement"],
    ],
    retail: [
      ["Ceramic dinner sets · 80 units", 0, 3, "High", 72, 9, "WhatsApp"],
      ["Linen shirts · 60 pcs", 1, 4, "High", 95, 4, "Instagram"],
      ["Mixed homeware · 240 units", 2, 3, "High", 68, 16, "Referral"],
      ["Premium towels · 150 pcs", 3, 2, "Medium", 52, 22, "Walk-in"],
      ["Gift hampers · 35 units", 0, 1, "Medium", 30, 32, "Google"],
      ["Storage baskets · 12 units", 2, 5, "Low", 100, -2, "Website"],
      ["Cafe tableware restock", 1, 2, "Medium", 57, 25, "Referral"],
      ["Festive décor consignment", 3, 0, "Low", 20, 43, "Instagram"],
    ],
  };
  const dealValueSeeds: Record<IndustryKey, number[]> = {
    insurance: [145000, 86000, 42000, 235000, 28500, 36000, 125000, 68000],
    "real-estate": [8500000, 12500000, 6200000, 18000000, 4800000, 9800000, 7200000, 15600000],
    retail: [68000, 96000, 42000, 185000, 34000, 12500, 86000, 128000],
  };
  const deals = dealSeeds[industry].map((seed, index) => {
    const [title, contactIndex, stageIndex, priority, probability, closeIn, dealSource] = seed;
    const customer = customers[contactIndex % customers.length];
    const stage = stages[stageIndex];
    const owner = team[(index % 3) + 1];
    return {
      id: base + 900 + index,
      title,
      value: dealValueSeeds[industry][index],
      stageId: stage.id,
      stage: stage.name,
      stageColor: stage.color,
      company: customer.company || customer.name,
      contact: customer.name,
      contactId: customer.id,
      expectedCloseAt: atDay(closeIn, 17),
      owner: owner.name,
      avatar: owner.avatar,
      priority,
      probability,
      source: dealSource,
    };
  });
  const companies = deriveCompanies(customers, deals, source.org);

  return {
    organization: source.org,
    profile,
    currentUser: team[0],
    team,
    stages,
    leads,
    customers,
    deals,
    companies,
    tasks,
    payments,
    quotations,
    activities,
    notifications,
  };
}
