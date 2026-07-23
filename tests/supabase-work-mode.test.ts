import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { createEmptySchoolState } from "@/lib/domain/empty-school-state";

const repositorySource = fs.readFileSync(
  path.join(process.cwd(), "lib", "data-access", "supabase-repositories.ts"),
  "utf8"
);
const providerSource = fs.readFileSync(
  path.join(process.cwd(), "components", "app", "app-provider.tsx"),
  "utf8"
);
const loginSource = fs.readFileSync(path.join(process.cwd(), "app", "login", "page.tsx"), "utf8");
const emptyState = createEmptySchoolState();

assert.equal(emptyState.schoolPassport.name, "");
assert.equal(emptyState.events.length, 0);
assert.equal(emptyState.importedDocuments.length, 0);
assert.equal(emptyState.exportDocuments.length, 0);
assert.ok(!repositorySource.includes('from "@/data/mock-data"'));
assert.ok(repositorySource.includes("`school-${authData.user.id}`"));
assert.ok(providerSource.includes("if (!data.session)"));
assert.ok(providerSource.includes("return initialState"));
assert.ok(loginSource.includes("Превышен лимит писем подтверждения Supabase"));

console.log("supabase-work-mode.test.ts: ok");
