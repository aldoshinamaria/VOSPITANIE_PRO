import assert from "node:assert/strict";

import { resolveWorkDataBackend } from "@/lib/data-access/backend-config";

assert.equal(resolveWorkDataBackend({}), "local");
assert.equal(
  resolveWorkDataBackend({
    NEXT_PUBLIC_DATA_BACKEND: "supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co"
  }),
  "local"
);
assert.equal(
  resolveWorkDataBackend({
    NEXT_PUBLIC_DATA_BACKEND: "supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test"
  }),
  "supabase"
);
assert.equal(
  resolveWorkDataBackend({
    NEXT_PUBLIC_DATA_BACKEND: "supabase",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy"
  }),
  "supabase"
);

console.log("backend-config.test.ts: ok");
