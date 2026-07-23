import assert from "node:assert/strict";

import {
  createWorkProgramComplianceChecker,
  getComplianceCheckStatus
} from "../lib/domain/federal-knowledge/work-program-compliance-checker";
import type {
  EducationLevel,
  EducationModule,
  EducationalSystem,
  FederalDirection,
  FederalKnowledgeBase,
  KpvrItem,
  NormativeDocument,
  WorkProgram,
  WorkProgramSection,
  WorkProgramSectionId
} from "../types/domain";

const directions = [
  ["civic", "Civic", ["civic", "law", "society"]],
  ["patriotic", "Patriotic", ["patriotic", "memory", "country"]],
  ["spiritual_moral", "Moral", ["family", "respect", "kindness"]],
  ["aesthetic", "Aesthetic", ["culture", "art", "museum"]],
  ["physical", "Physical", ["health", "sport", "safety"]],
  ["labor", "Labor", ["labor", "career", "profession"]],
  ["environmental", "Environmental", ["nature", "ecology", "environment"]],
  ["scientific_knowledge", "Science", ["science", "research", "project"]]
] as const;

const knowledgeBase: FederalKnowledgeBase = {
  id: "kb-test",
  title: "Test federal knowledge",
  version: "test",
  updatedAt: "2026-06-10",
  source: "Test source",
  directions: directions.map(([id, title, keywords]) => ({
    id,
    title,
    description: `${title} direction`,
    keywords: [...keywords],
    source: "Test source"
  })) as FederalDirection[],
  programSections: [
    sectionRequirement("target", "Target section"),
    sectionRequirement("content", "Content section"),
    sectionRequirement("organizational", "Organizational section"),
    sectionRequirement("kpvr", "KPVR"),
    sectionRequirement("appendices", "Appendices")
  ],
  requirements: [],
  targetResults: (["noo", "ooo", "soo"] as EducationLevel[]).flatMap((level) =>
    directions.map(([id, title, keywords]) => ({
      id: `target-${level}-${id}`,
      educationLevel: level,
      directionId: id,
      text: `${level} ${title} target`,
      required: true,
      verificationKeywords: [...keywords],
      source: "Test source"
    }))
  )
};

const modules: EducationModule[] = [
  {
    id: "module-main",
    title: "Main school affairs",
    description: "Main module",
    active: true
  }
];

const kpvr: KpvrItem[] = [
  {
    id: "kpvr-1",
    moduleId: "module-main",
    module: "Main school affairs",
    task: "School event",
    period: "September",
    responsible: "Deputy principal",
    status: "planned"
  }
];

const educationalSystem: EducationalSystem = {
  associations: [
    {
      id: "association-1",
      type: "volunteer_team",
      title: "Victory Volunteers",
      description: "Volunteer team",
      leader: "Teacher",
      participantsCount: 25,
      classes: "5-9",
      photoUrl: "",
      status: "active"
    }
  ],
  infrastructureObjects: [
    {
      id: "infrastructure-1",
      type: "museum",
      title: "School Museum",
      description: "Museum",
      responsible: "Teacher"
    }
  ],
  partners: [
    {
      id: "partner-1",
      title: "Veterans Council",
      type: "Public organization",
      cooperationDescription: "Joint events",
      contactPerson: "Contact"
    }
  ]
};

const normativeDocuments: NormativeDocument[] = [
  normativeDocument("norm-1", "Federal work program", "federal_work_program", "current"),
  normativeDocument("norm-2", "Federal calendar plan", "federal_calendar_plan", "current")
];

run("empty program creates critical issues and does not throw", () => {
  const check = checker().check({ federalKnowledgeBase: knowledgeBase });

  assert.equal(getComplianceCheckStatus(check), "needs_revision");
  assert.ok(check.issues.some((issue) => issue.severity === "critical"));
  assert.ok(check.sectionCoverage.every((section) => section.status === "failed"));
  assert.ok(
    check.issues
      .filter((issue) => issue.targetModule === "work-program" && issue.targetSectionId)
      .every((issue) => issue.targetUrl.includes(`#section-${issue.targetSectionId}`))
  );
});

run("partially filled program is marked for review", () => {
  const check = checker().check({
    federalKnowledgeBase: knowledgeBase,
    workProgram: workProgram([workSection("target", "Short target text")])
  });

  assert.ok(check.overallScore < 70);
  assert.ok(check.issues.some((issue) => issue.status === "needs_review" || issue.status === "failed"));
});

run("complete program has high score and no critical issues", () => {
  const check = checker().check({
    federalKnowledgeBase: knowledgeBase,
    workProgram: completeProgram(),
    kpvr,
    educationModules: modules,
    educationalSystem,
    normativeDocuments
  });

  assert.ok(check.overallScore >= 85);
  assert.equal(check.issues.some((issue) => issue.severity === "critical"), false);
});

run("missing upbringing directions creates direction issues", () => {
  const check = checker().check({
    federalKnowledgeBase: knowledgeBase,
    workProgram: workProgram(knowledgeBase.programSections.map((section) => workSection(section.id as WorkProgramSectionId, repeated("generic text")))),
    normativeDocuments
  });

  assert.ok(check.directionCoverage.some((direction) => direction.status === "failed"));
});

run("kpvr modules absent from content create kpvr issue", () => {
  const program = completeProgram(repeated(allKeywords()));
  const check = checker().check({
    federalKnowledgeBase: knowledgeBase,
    workProgram: program,
    kpvr,
    educationModules: modules,
    educationalSystem,
    normativeDocuments
  });

  assert.ok(check.issues.some((issue) => issue.targetModule === "kpvr"));
});

run("educational system absent from program creates issue", () => {
  const program = completeProgram(repeated(allKeywords()));
  const check = checker().check({
    federalKnowledgeBase: knowledgeBase,
    workProgram: program,
    educationalSystem,
    educationModules: modules,
    kpvr,
    normativeDocuments
  });

  assert.ok(check.issues.some((issue) => issue.targetModule === "educational-system"));
});

run("missing target results create target coverage issue", () => {
  const check = checker().check({
    federalKnowledgeBase: knowledgeBase,
    workProgram: workProgram([
      workSection("content", repeated(allKeywords())),
      workSection("organizational", repeated(allKeywords())),
      workSection("kpvr", repeated(allKeywords())),
      workSection("appendices", repeated(allKeywords()))
    ]),
    normativeDocuments
  });

  assert.ok(check.targetResultCoverage.every((level) => level.status === "failed"));
  assert.ok(check.issues.some((issue) => issue.targetSectionId === "target"));
});

run("missing appendices data creates appendices issues", () => {
  const check = checker().check({
    federalKnowledgeBase: knowledgeBase,
    workProgram: completeProgram(),
    normativeDocuments
  });

  assert.ok(check.issues.some((issue) => issue.targetSectionId === "appendices"));
});

function checker() {
  return createWorkProgramComplianceChecker();
}

function sectionRequirement(id: WorkProgramSectionId, title: string) {
  return {
    id,
    title,
    description: `${title} description`,
    required: true,
    presenceCriteria: ["present"],
    completenessCriteria: ["complete"],
    requirementSource: "Test source"
  };
}

function completeProgram(contentText = repeated(`${allKeywords()} Main school affairs Victory Volunteers School Museum Veterans Council`)) {
  return workProgram([
    workSection("target", repeated(`noo ooo soo ${allKeywords()}`)),
    workSection("content", contentText),
    workSection("organizational", repeated(allKeywords())),
    workSection("kpvr", repeated(`Main school affairs ${allKeywords()}`)),
    workSection("appendices", repeated(`KPVR extracurricular modules partners educational system ${allKeywords()}`))
  ]);
}

function workProgram(sections: WorkProgramSection[]): WorkProgram {
  return {
    id: "program-test",
    title: "Program",
    academicYear: "2026/2027",
    sections,
    schoolCulture: {
      id: "school-culture",
      title: "School culture",
      subsections: []
    },
    progress: {
      percent: 100,
      status: "ready",
      missingData: [],
      reviewNotes: []
    },
    versions: [],
    sectionVersions: {},
    updatedAt: "2026-06-10T00:00:00.000Z"
  };
}

function workSection(id: WorkProgramSectionId, text: string): WorkProgramSection {
  return {
    id,
    title: id,
    status: "generated",
    progress: {
      percent: 100,
      status: "ready",
      missingData: [],
      reviewNotes: []
    },
    subsections: [
      {
        id: `${id}-subsection`,
        title: `${id} subsection`,
        generatedContent: [
          {
            id: `${id}-content`,
            text,
            originalText: text,
            sources: [],
            status: "generated",
            readiness: "ready"
          }
        ],
        progress: {
          percent: 100,
          status: "ready",
          missingData: [],
          reviewNotes: []
        },
        sources: []
      }
    ],
    sources: [],
    versions: []
  };
}

function normativeDocument(
  id: string,
  title: string,
  category: NormativeDocument["category"],
  actualityStatus: NormativeDocument["actualityStatus"]
): NormativeDocument {
  return {
    id,
    title,
    category,
    level: "federal",
    documentDate: "2026-01-01",
    version: "1",
    source: "Test",
    actualityStatus,
    uploadedAt: "2026-06-10T00:00:00.000Z",
    fileName: `${id}.docx`,
    fileType: "docx",
    sizeBytes: 100,
    requirements: []
  };
}

function allKeywords() {
  return directions.flatMap(([, , keywords]) => keywords).join(" ");
}

function repeated(value: string) {
  return Array.from({ length: 12 }, () => value).join(" ");
}

function run(name: string, test: () => void) {
  try {
    test();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}
