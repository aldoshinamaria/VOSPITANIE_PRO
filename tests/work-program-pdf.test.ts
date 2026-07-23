import assert from "node:assert/strict";

import { createDemoSchoolFactory } from "@/lib/domain/demo-school-factory";
import {
  buildWorkProgramPdfBlob,
  buildWorkProgramPdfDefinition,
  getWorkProgramPdfFileName
} from "@/lib/domain/work-program/work-program-pdf";

async function main() {
  const program = createDemoSchoolFactory().createDemoSchool("urban").workProgram;
  const definition = buildWorkProgramPdfDefinition(program) as {
    content: unknown[];
    pageSize: string;
  };

  assert.equal(definition.pageSize, "A4");
  assert.ok(definition.content.length > program.sections.length);
  assert.ok(getWorkProgramPdfFileName(program).endsWith(".pdf"));

  const blob = await buildWorkProgramPdfBlob(program);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const signature = String.fromCharCode(...bytes.slice(0, 4));

  assert.equal(signature, "%PDF");
  assert.ok(bytes.length > 10_000);
  console.log("ok - native work-program PDF is generated with a valid signature");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
