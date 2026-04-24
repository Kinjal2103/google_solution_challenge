require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const TABLES = [
  "organizations",
  "volunteers",
  "needs",
  "assignments",
  "outcomes",
  "need_history",
  "assignment_history",
];

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select("*", { count: "exact", head: false }).limit(1);
  if (error) {
    console.log(`✗ ${tableName} — query failed (${error.message})`);
    return;
  }

  const rowCount = Array.isArray(data) ? data.length : 0;
  if (rowCount > 0) {
    console.log(`✓ ${tableName} — ${rowCount} rows found`);
  } else {
    console.log(`✗ ${tableName} — no rows (check RLS policies)`);
  }
}

async function main() {
  for (const table of TABLES) {
    await checkTable(table);
  }
}

main().catch((error) => {
  console.error("RLS check crashed:", error);
  process.exit(1);
});
