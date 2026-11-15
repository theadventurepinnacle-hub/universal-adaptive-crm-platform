import type { IndustryKey, IndustryProfile } from "@/lib/crm-types";

export const industryProfiles: Record<IndustryKey, IndustryProfile> = {
  adventure: {
    label: "Travel & Tourism",
    eyebrow: "Enquiries, trips & traveller relationships",
    leadLabel: "Enquiry",
    leadPlural: "Enquiries",
    customerLabel: "Traveller",
    customerPlural: "Travellers",
    productLabel: "Trip package",
    pipelineName: "Trip Booking Pipeline",
    modules: [
      { label: "Trips", icon: "package" },
      { label: "Departures", icon: "calendar" },
      { label: "Itineraries", icon: "file" },
      { label: "Payments", icon: "wallet" },
    ],
    customFields: [
      { label: "Destination", key: "destination" },
      { label: "Travel date", key: "travelDate" },
      { label: "Group size", key: "groupSize" },
      { label: "Trip package", key: "tripPackage" },
    ],
    sources: ["WhatsApp", "Instagram", "Facebook", "Website", "Referral", "Phone", "Walk-in", "Advertisement", "Facebook Lead Ads"],
    attention: [],
    insights: [],
    chart: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, value: 0 })),
  },
};
