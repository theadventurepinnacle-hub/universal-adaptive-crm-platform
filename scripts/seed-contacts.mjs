// One-time utility: enriches already-provisioned demo workspaces with the
// expanded contact set. Fresh databases receive the same contacts through the
// normal idempotent demo seed, so this script only inserts missing contacts.
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const envFile = readFileSync(new URL("../.env", import.meta.url), "utf8");
const connectionString = process.env.DATABASE_URL ?? envFile.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
const pool = new Pool({ connectionString });

const segments = ["VIP", "Active", "Active", "Inactive", "Active", "New", "VIP", "Active", "Inactive", "Active"];

const industries = [
  {
    slug: "insurance", baseValue: 86000, fields: ["policyType", "coverage", "renewalDate"],
    rows: [
      ["Anand Krishnan", "Family Health Max", "POL-31902", "Nov 14, 2026"],
      ["Zainab Ali", "Term Life Secure", "POL-20884", "Jan 09, 2027"],
      ["Sreekumar Nair", "Group Health Plus", "POL-27613", "Oct 30, 2026"],
      ["Tara Varghese", "Motor Shield", "POL-33277", "Dec 18, 2026"],
      ["Prakash Iyer", "Business Guard", "POL-19448", "Sep 26, 2026"],
      ["Lena Fernandes", "Travel Secure", "POL-30117", "Feb 02, 2027"],
    ],
  },
  {
    slug: "real-estate", baseValue: 7800000, fields: ["propertyType", "budget", "location"],
    rows: [
      ["Anitha Suresh", "2 BHK Apartment", "Marina C-411", "Vyttila"],
      ["Geo Builders", "Commercial Shop", "Market G-04", "MG Road"],
      ["Sameer Khan", "3 BHK Apartment", "Skyline A-808", "Kakkanad"],
      ["Megha Rose", "Villa", "Palm Grove V-27", "Thrippunithura"],
      ["Joseph Chacko", "Office Space", "Commerce 3B", "Kakkanad"],
      ["Trisha Iyer", "1 BHK Apartment", "Marina A-102", "Aluva"],
    ],
  },
  {
    slug: "retail", baseValue: 54000, fields: ["productInterest", "quantity", "store"],
    rows: [
      ["Nandini Stores", "Ceramic dinner sets", "24 sets", "Jayanagar"],
      ["Arjun Pillai", "Linen shirts", "18 pcs", "Koramangala"],
      ["Bloom Decor", "Décor hampers", "12 units", "Indiranagar"],
      ["Sameera Ali", "Storage baskets", "30 units", "Whitefield"],
      ["Fresh Mart", "Premium towels", "45 pcs", "Central Store"],
      ["Deepak Verma", "Candle sets", "20 units", "Whitefield"],
    ],
  },
];

for (const industry of industries) {
  const { rows: orgs } = await pool.query("select id from organizations where slug = $1 limit 1", [industry.slug]);
  const org = orgs[0];
  if (!org) continue;
  const { rows: users } = await pool.query("select id, name from users where organization_id = $1 order by id", [org.id]);
  if (!users.length) continue;
  const { rows: existing } = await pool.query("select name from customers where organization_id = $1", [org.id]);
  const existingNames = new Set(existing.map((row) => row.name));

  let inserted = 0;
  for (let offset = 0; offset < industry.rows.length; offset += 1) {
    const index = offset + 4;
    const [name, first, second, third] = industry.rows[offset];
    if (existingNames.has(name)) continue;
    const owner = users[(index % 3) + 1] ?? users[1] ?? users[0];
    const company = index % 2 ? name : null;
    const phone = `+91 98${org.id}${index}5 42${index}18`;
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`;
    const lastContactAt = new Date(Date.now() - index * 3 * 86_400_000);
    const customData = {
      [industry.fields[0]]: first,
      [industry.fields[1]]: second,
      [industry.fields[2]]: third,
    };
    await pool.query(
      `insert into customers (organization_id, owner_id, name, company, phone, email, segment, total_value, custom_data, last_contact_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [org.id, owner?.id ?? null, name, company, phone, email, segments[index] ?? "Active", industry.baseValue * (index + 1), customData, lastContactAt],
    );
    inserted += 1;
  }
  console.log(`${industry.slug}: inserted ${inserted} contacts`);
}

await pool.end();
