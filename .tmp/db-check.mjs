import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const envText = fs.readFileSync(".env", "utf8");
const env = {};
for (const rawLine of envText.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const key = line.slice(0, idx).trim();
  let value = line.slice(idx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase vars in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const checks = [];

  const officeCount = await supabase.from("engineering_offices").select("id", { count: "exact", head: true });
  const verifiedCount = await supabase.from("engineering_offices").select("id", { count: "exact", head: true }).eq("is_verified", true);
  const servicesCount = await supabase.from("service_catalog").select("catalog_id", { count: "exact", head: true });
  const templatesApprovedCount = await supabase.from("templates").select("template_id", { count: "exact", head: true }).eq("is_approved", true).eq("is_available", true);
  const profilesCount = await supabase.from("profiles").select("id", { count: "exact", head: true });

  checks.push({ name: "engineering_offices_count", ...officeCount });
  checks.push({ name: "verified_offices_count", ...verifiedCount });
  checks.push({ name: "service_catalog_count", ...servicesCount });
  checks.push({ name: "templates_approved_available_count", ...templatesApprovedCount });
  checks.push({ name: "profiles_count", ...profilesCount });

  const servicesByVerified = await supabase
    .from("service_catalog")
    .select("catalog_id, office_id, category, sub_category, price, engineering_offices!inner(id,is_verified,coverage_area,public_profiles(name))")
    .eq("engineering_offices.is_verified", true)
    .limit(20);

  const templatesMarketplace = await supabase
    .from("templates")
    .select("template_id, office_id, title, is_approved, is_available, category, price, engineering_offices!inner(id,is_verified,coverage_area,public_profiles(name))")
    .eq("is_approved", true)
    .eq("is_available", true)
    .eq("engineering_offices.is_verified", true)
    .limit(20);

  const servicesSimple = await supabase
    .from("service_catalog")
    .select("catalog_id, office_id, category, sub_category, price")
    .limit(10);

  const templatesSimple = await supabase
    .from("templates")
    .select("template_id, office_id, title, is_approved, is_available, category, price")
    .limit(10);

  console.log("=== COUNTS ===");
  for (const c of checks) {
    console.log(c.name, { count: c.count, error: c.error?.message || null });
  }

  console.log("=== SERVICES VERIFIED JOIN QUERY ===");
  console.log({ error: servicesByVerified.error?.message || null, rows: servicesByVerified.data?.length || 0 });
  if (servicesByVerified.data?.length) console.log(JSON.stringify(servicesByVerified.data.slice(0, 3), null, 2));

  console.log("=== TEMPLATES VERIFIED/APPROVED JOIN QUERY ===");
  console.log({ error: templatesMarketplace.error?.message || null, rows: templatesMarketplace.data?.length || 0 });
  if (templatesMarketplace.data?.length) console.log(JSON.stringify(templatesMarketplace.data.slice(0, 3), null, 2));

  console.log("=== SIMPLE SERVICES (NO JOIN) ===");
  console.log({ error: servicesSimple.error?.message || null, rows: servicesSimple.data?.length || 0 });

  console.log("=== SIMPLE TEMPLATES (NO JOIN) ===");
  console.log({ error: templatesSimple.error?.message || null, rows: templatesSimple.data?.length || 0 });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
