/**
 * Static QA checks (no Supabase credentials required).
 * Run: node scripts/qa-check.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function check(name, ok, detail = "") {
  if (!ok) errors.push(`${name}: ${detail}`);
  else console.log(`✓ ${name}`);
}

const requiredFiles = [
  "backend/src/index.js",
  "frontend/src/main.js",
  "frontend/public/manifest.json",
  "frontend/public/sw.js",
  "backend/supabase/schema.sql",
  "render.yaml",
];

for (const f of requiredFiles) {
  check(`file ${f}`, existsSync(join(root, f)));
}

const indexSrc = readFileSync(join(root, "backend/src/index.js"), "utf8");
check("leads route registered", indexSrc.includes("/api/v1/leads"));
check("orders route registered", indexSrc.includes("/api/v1/orders"));
check("reviews route registered", indexSrc.includes("/api/v1/reviews"));

const mainSrc = readFileSync(join(root, "frontend/src/main.js"), "utf8");
check("leads tab wired", mainSrc.includes('activeTab === "leads"'));
check("auth hash recovery", mainSrc.includes("consumeAuthHashFromUrl"));

try {
  execSync("npm run build", { cwd: join(root, "frontend"), stdio: "pipe" });
  check("frontend build", true);
} catch (e) {
  check("frontend build", false, e.stderr?.toString() || e.message);
}

if (errors.length) {
  console.error("\nQA FAILED:\n", errors.join("\n"));
  process.exit(1);
}

console.log("\nAll static QA checks passed.");
