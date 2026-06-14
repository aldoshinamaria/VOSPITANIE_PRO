import assert from "node:assert/strict";

import { createModeAwareDataAccess } from "@/lib/data-access/mode-aware-data-access";
import { DEMO_LOADED_AT_STORAGE_KEY, DEMO_STATE_STORAGE_KEY, WORK_STATE_STORAGE_KEY } from "@/lib/data-access/storage-keys";
import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";
import { createEmptySchoolState } from "@/lib/domain/empty-school-state";

class MemoryStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const localStorage = new MemoryStorage();

Object.defineProperty(globalThis, "window", {
  value: { localStorage },
  configurable: true
});

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  await run("demo loading does not affect work-state", async () => {
    localStorage.clear();
    const factory = createDemoSchoolFactory();
    const workFallback = createEmptySchoolState();
    const workAccess = createModeAwareDataAccess("work", workFallback);
    const demoAccess = createModeAwareDataAccess("demo", workFallback);
    const workState = await Promise.resolve(workAccess.getState());

    await Promise.resolve(demoAccess.saveState(factory.createDemoSchool("urban")));

    const nextWorkState = await Promise.resolve(workAccess.getState());
    assert.equal(nextWorkState.schoolPassport.name, workState.schoolPassport.name);
    assert.equal(nextWorkState.events.length, 0);
    assert.ok(localStorage.getItem(DEMO_STATE_STORAGE_KEY));
    assert.ok(localStorage.getItem(WORK_STATE_STORAGE_KEY));
  });

  await run("work mode does not see demo-state", async () => {
    localStorage.clear();
    const factory = createDemoSchoolFactory();
    const fallback = createEmptySchoolState();
    const demoAccess = createModeAwareDataAccess("demo", fallback);

    await Promise.resolve(demoAccess.saveState(factory.createDemoSchool("urban")));

    const workAccess = createModeAwareDataAccess("work", fallback);
    const workState = await Promise.resolve(workAccess.getState());
    assert.equal(workState.events.length, 0);
    assert.equal(workState.schoolPassport.name, "");
  });

  await run("demo reset does not delete work-state", async () => {
    localStorage.clear();
    const fallback = createEmptySchoolState();
    const workAccess = createModeAwareDataAccess("work", fallback);
    const demoAccess = createModeAwareDataAccess("demo", fallback);

    await Promise.resolve(
      workAccess.saveState({
        ...fallback,
        schoolPassport: { ...fallback.schoolPassport, name: "Рабочая школа" }
      })
    );
    await Promise.resolve(demoAccess.reset());

    const workState = await Promise.resolve(workAccess.getState());
    assert.equal(workState.schoolPassport.name, "Рабочая школа");
  });

  await run("restart keeps demo and work states independently", async () => {
    localStorage.clear();
    const factory = createDemoSchoolFactory();
    const fallback = createEmptySchoolState();

    await Promise.resolve(createModeAwareDataAccess("demo", fallback).saveState(factory.createDemoSchool("urban")));
    await Promise.resolve(
      createModeAwareDataAccess("work", fallback).saveState({
        ...fallback,
        schoolPassport: { ...fallback.schoolPassport, name: "Рабочая школа" }
      })
    );
    localStorage.setItem(DEMO_LOADED_AT_STORAGE_KEY, "2026-06-14T00:00:00.000Z");

    const restartedDemo = await Promise.resolve(createModeAwareDataAccess("demo", fallback).getState());
    const restartedWork = await Promise.resolve(createModeAwareDataAccess("work", fallback).getState());
    assert.ok(restartedDemo.events.length > 0);
    assert.equal(restartedWork.events.length, 0);
    assert.equal(restartedWork.schoolPassport.name, "Рабочая школа");
    assert.equal(localStorage.getItem(DEMO_LOADED_AT_STORAGE_KEY), "2026-06-14T00:00:00.000Z");
  });
}

async function run(name: string, test: () => Promise<void>) {
  await test();
  console.log(`ok - ${name}`);
}

