# AGENTS.md

## Project

VOSPITANIE_PRO is a Next.js + TypeScript + TailwindCSS application for school educational work management.

## Project Mission

VOSPITANIE_PRO helps deputy heads for educational work manage a school educational system, events, KPVR, activity plans, work-program documents, document checks, and reporting from one connected data model.

The product goal is not to create isolated pages or static templates. Every major feature should strengthen the long-term system:

- one event can feed multiple school documents;
- imported documents can become auditable data sources;
- school entities such as associations, partners, infrastructure, traditions, and events remain traceable;
- generated documents must explain which data they use;
- future AI integrations must be replaceable behind typed contracts and must not be hardcoded into UI.

## Working Rules

- Do not change business logic unless the task explicitly requires it.
- Do not modify Demo Mode or Work Mode unless the task explicitly targets app mode behavior.
- Do not change `AppState.events`, KPVR, work-program, or compliance logic during unrelated UI or document-processing tasks.
- Keep document-processing changes isolated inside `lib/domain/document-processing`, `types/document-processing.ts`, and the relevant UI page.
- Do not add external AI APIs unless explicitly requested.
- Prefer rule-based services and typed contracts for new analysis features.
- Run available checks before reporting completion:
  - `npm.cmd run test`
  - `npm.cmd run lint`
  - `npm.cmd run build`

## MVP Protection

Current priority:

1. stable document upload;
2. stable document analysis;
3. stable educational data model;
4. stable generation of KPVR and work-program drafts.

Avoid:

- premature optimization;
- micro-features;
- visual redesigns without business value;
- architecture rewrites.

Prefer working functionality over perfect implementation.

## Demo Protection

Demo Mode is a product showcase and must stay isolated from Work Mode.

- Demo data must not overwrite work data.
- Demo Mode must not write to work localStorage keys.
- Work Mode must not read demo state or depend on `DemoSchoolFactory`.
- Demo routes, demo navigation, and showcase flows must remain separate from working user scenarios.
- Do not remove or weaken the mode indicator.
- Before changing app state, navigation, storage, onboarding, or demo pages, verify that:
  - loading demo data does not affect work-state;
  - resetting demo data does not delete work-state;
  - Work Mode opens without demo school data;
  - Demo Mode remains useful for public presentation.

## Educational Domain Rules

The domain model must reflect how Russian schools actually prepare educational work documents.

- `SchoolEvent` is the source of truth for activities used in KPVR, activity plans, execution control, reports, and work-program generation.
- Do not duplicate events into separate plan-specific entities.
- Plans are projections of events and event-direction relations.
- KPVR must remain grouped by educational modules and filtered by education levels: NОО, ООО, СОО.
- Work-program text should be generated from system data, not stored as static final text unless the feature explicitly concerns user edits or versioning.
- Keep traceability for generated or imported content: source document, preview item, import batch, confidence, and timestamp where applicable.
- Do not silently import questionable records into operational entities.
- Prefer preview, dry-run, confirmation, and reversible import patterns for data extracted from documents.
- School-specific entities should be modeled explicitly when needed:
  - educational associations;
  - social partners;
  - infrastructure;
  - traditions;
  - activity directions;
  - execution evidence.

## Federal Documents Authority

When educational documents conflict, use the following priority:

1. Federal legislation
2. Federal State Educational Standards (FGOS)
3. Federal Educational Programs (FOP)
4. Federal Work Program of Upbringing
5. Federal Calendar Plan of Educational Activities
6. Ministry of Education recommendations
7. Regional documents
8. Municipal documents
9. School local acts

Do not allow lower-priority documents to override higher-priority requirements.

## Document Processing Rules

Document processing must stay auditable, reversible, and separated from UI.

- Do not mix file storage, text extraction, structure extraction, normalization, validation, classification, event extraction, and import logic.
- Do not place document analysis business rules directly in React components.
- Do not use external AI APIs unless explicitly requested.
- Current rule-based analyzers must be replaceable by future AI analyzers through typed contracts.
- `processedDocuments` may store processing results and previews, but must not automatically mutate operational data.
- `AppState.events` can be updated from document previews only through explicit user action.
- Any import from document previews must support:
  - dry-run;
  - duplicate detection;
  - incomplete/skipped status;
  - source metadata;
  - future rollback by batch.
- Keep `/import-documents` flow separate from `/document-processing` unless the task explicitly merges them.
- When adding document-derived entities, start with preview-only extraction before adding import.

## Import Safety Rules

Never automatically import extracted entities into operational school data.

All extracted records must pass:

- preview;
- validation;
- duplicate detection;
- user confirmation.

If confidence is low:

- mark record as uncertain;
- keep it in preview only;
- do not create operational entities.

## Release Checklist

Before reporting a task complete, use the smallest checklist that fits the change. For production-facing changes, verify all items:

- `npm.cmd run test` passes.
- `npm.cmd run lint` passes.
- `npm.cmd run build` passes.
- Main routes open without `Application error`.
- CSS and JS assets return HTTP 200 in dev mode.
- Demo Mode and Work Mode remain isolated.
- No unrelated files are changed.
- No generated build artifacts are committed.
- `git status --short` is reviewed.
- User-facing report includes:
  - changed files;
  - what was verified;
  - known limitations;
  - whether a commit was created.

## Local Development

Start the app with:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

```text
http://localhost:3000/
```

If styles disappear after `next build`, stop the dev server, delete only `.next`, and restart `npm.cmd run dev`.
