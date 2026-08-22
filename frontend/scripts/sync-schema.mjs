/**
 * TRANSITIONAL (Phase B → D). Delete this script, and frontend/prisma/, once every page
 * reads through the backend API.
 *
 * The backend owns the schema. During migration the frontend still queries the database
 * directly for pages not yet repointed, so it needs a generated Prisma client — and
 * `prisma generate --schema ../backend/prisma/...` would emit into the *backend's*
 * node_modules, leaving the frontend without one.
 *
 * So the schema is copied here immediately before generating. It is derived, never edited:
 * the header says so, and `--check` fails CI if the copy has drifted.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE = resolve(process.cwd(), "../backend/prisma/schema.prisma");
const TARGET = resolve(process.cwd(), "prisma/schema.prisma");
const BANNER = `// GENERATED COPY — DO NOT EDIT.
// The authoritative schema is backend/prisma/schema.prisma.
// Regenerate with: npm run sync:schema
// This file disappears when Phase D removes the frontend's direct database access.

`;

if (!existsSync(SOURCE)) {
  console.error(`Cannot find the backend schema at ${SOURCE}`);
  process.exit(1);
}

const wanted = BANNER + readFileSync(SOURCE, "utf8");

if (process.argv.includes("--check")) {
  const actual = existsSync(TARGET) ? readFileSync(TARGET, "utf8") : "";
  if (actual !== wanted) {
    console.error("frontend/prisma/schema.prisma has drifted from the backend schema. Run: npm run sync:schema");
    process.exit(1);
  }
  console.log("schema copy is in sync with the backend");
  process.exit(0);
}

writeFileSync(TARGET, wanted);
console.log("synced schema from backend/prisma/schema.prisma");
