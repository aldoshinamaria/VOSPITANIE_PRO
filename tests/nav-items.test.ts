import assert from "node:assert/strict";

import { getNavItemsForMode } from "@/components/app/nav-items";
import { resolveAppMode } from "@/lib/data-access/app-mode-routing";

run("work mode hides demo navigation and shows work onboarding", () => {
  const items = getNavItemsForMode("work");
  const hrefs = items.map((item) => item.href);

  assert.ok(!hrefs.includes("/demo"));
  assert.ok(!hrefs.includes("/demo-showcase"));
  assert.ok(hrefs.includes("/"));
  assert.ok(hrefs.includes("/launch-readiness"));
  assert.ok(hrefs.includes("/school-passport"));
  assert.ok(!hrefs.includes("/import-documents"));
  assert.ok(hrefs.includes("/document-processing"));
  assert.ok(hrefs.includes("/import-history"));
  assert.ok(hrefs.includes("/work-program"));
});

run("demo mode keeps demo entry points isolated", () => {
  const items = getNavItemsForMode("demo");
  const hrefs = items.map((item) => item.href);

  assert.deepEqual(hrefs, ["/demo", "/demo-showcase"]);
});

run("demo mode survives navigation to shared feature routes", () => {
  assert.equal(resolveAppMode("/demo", null), "demo");
  assert.equal(resolveAppMode("/demo-showcase", "work"), "demo");
  assert.equal(resolveAppMode("/kpvr", "demo"), "demo");
  assert.equal(resolveAppMode("/events", "demo"), "demo");
  assert.equal(resolveAppMode("/kpvr", null), "work");
  assert.equal(resolveAppMode("/login", "demo"), "work");
  assert.equal(resolveAppMode("/work", "demo"), "work");
  assert.equal(resolveAppMode("/", "demo"), "work");
});

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}
