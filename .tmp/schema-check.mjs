import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const envText = fs.readFileSync(".env", "utf8");
const env = {};
for (const rawLine of envText.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  let value = line.slice(idx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  env[line.slice(0, idx).trim()] = value;
}
const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function main() {
  const tables = ["service_catalog", "templates", "engineering_offices", "profiles"];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(3);
    console.log("TABLE", table, { rows: data?.length ?? 0, error: error?.message || null, sample: data?.[0] || null });
  }
  const { data: pubs, error: pubErr } = await supabase.from("public_profiles").select("*").limit(3);
  console.log("VIEW public_profiles", { rows: pubs?.length ?? 0, error: pubErr?.message || null, sample: pubs?.[0] || null });
}
main().catch(e => { console.error(e); process.exit(1); });
