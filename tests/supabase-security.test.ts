import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const schema = fs.readFileSync(path.join(process.cwd(), "supabase", "schema.sql"), "utf8").toLowerCase();
const tenantTables = [
  "schools",
  "school_memberships",
  "partners",
  "modules",
  "events",
  "educational_associations",
  "school_infrastructure_objects",
  "educational_system_partners",
  "imported_documents",
  "extracted_events",
  "normative_documents",
  "document_processing_state",
  "work_programs",
  "extracurricular_programs",
  "staff"
];

run("schema defines owner and membership authorization", () => {
  assert.ok(schema.includes("owner_id uuid references auth.users"));
  assert.ok(schema.includes("create table if not exists public.school_memberships"));
  assert.ok(schema.includes("private.can_access_school"));
  assert.ok(schema.includes("private.can_manage_school"));
});

run("every tenant table is covered by RLS setup", () => {
  tenantTables.forEach((table) => {
    const directRls = schema.includes(`alter table public.${table} enable row level security`);
    const loopRls =
      schema.includes(`'${table}'`) &&
      schema.includes("alter table public.%i enable row level security");

    assert.ok(directRls || loopRls, `RLS setup missing for ${table}`);
  });
});

run("anonymous access is revoked and authenticated grants are explicit", () => {
  assert.ok(schema.includes("revoke all on all tables in schema public from anon"));
  assert.ok(schema.includes("to authenticated"));
  assert.ok(schema.includes("grant execute on function private.can_access_school"));
  assert.ok(!schema.includes("service_role"));
  assert.ok(!schema.includes("auth.role()"));
});

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}
