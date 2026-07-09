import assert from "node:assert/strict";

import { getNavItemsForMode } from "@/components/app/nav-items";

run("work mode hides demo navigation and shows work onboarding", () => {
  const items = getNavItemsForMode("work");
  const hrefs = items.map((item) => item.href);

  assert.ok(!hrefs.includes("/demo"));
  assert.ok(!hrefs.includes("/demo-showcase"));
  assert.ok(hrefs.includes("/"));
  assert.ok(hrefs.includes("/launch-readiness"));
  assert.ok(hrefs.includes("/school-passport"));
  assert.ok(hrefs.includes("/import-documents"));
  assert.ok(hrefs.includes("/document-processing"));
  assert.ok(hrefs.includes("/work-program"));
});

run("demo mode keeps demo entry points isolated", () => {
  const items = getNavItemsForMode("demo");
  const hrefs = items.map((item) => item.href);

  assert.deepEqual(hrefs, ["/demo", "/demo-showcase"]);
});

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}
