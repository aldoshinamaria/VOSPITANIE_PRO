import assert from "node:assert/strict";

import { getNavItemsForMode } from "@/components/app/nav-items";

run("work mode hides demo navigation", () => {
  const titles = getNavItemsForMode("work").map((item) => item.title);

  assert.ok(!titles.includes("Демо"));
  assert.ok(!titles.includes("Демонстрационный маршрут"));
  assert.ok(!titles.includes("Подготовка к запуску"));
  assert.ok(titles.includes("Паспорт школы"));
  assert.ok(titles.includes("Рабочая программа"));
});

run("demo mode shows only demo navigation", () => {
  const items = getNavItemsForMode("demo");
  const titles = items.map((item) => item.title);

  assert.deepEqual(titles, ["Демо", "Демонстрационный маршрут"]);
  assert.ok(items.every((item) => item.href.startsWith("/demo")));
});

function run(name: string, test: () => void) {
  test();
  console.log(`ok - ${name}`);
}

