# Document Processing Test Scenarios

## DOCX

- Input: DOCX with headings, paragraphs, lists, tables, footer/header-like text and appendix heading.
- Expected: text extracted, sections detected, lists detected, tables detected from text layout when available, validation `good` or `excellent`.
- Manual check: user sees found content and confirms before downstream use.

## Text PDF

- Input: PDF with selectable text and 5+ pages.
- Expected: text extracted page by page, page count captured, no OCR warning, validation `good` or `excellent`.
- Manual check: user verifies section boundaries because PDF headings can be less reliable.

## Scanned PDF

- Input: image-only PDF.
- Expected: status `requires_ocr`, warning shown, document cannot be confirmed for downstream use.
- Manual check: user sees that OCR is required and the system does not pretend the scan is analyzable.

## XLSX

- Input: XLSX with up to 20 sheets and tabular rows.
- Expected: sheet names extracted, tables built per sheet, column headers inferred from first row, validation `good` or `excellent`.
- Manual check: user verifies table headers before AI/event/normative extraction.

## Empty File

- Input: zero-byte DOCX/PDF/XLSX or file with no extractable content.
- Expected: security or validation error, status `invalid`, log entry with error.

## Corrupted File

- Input: broken archive with `.docx` or `.xlsx` extension, invalid PDF bytes.
- Expected: processing fails safely, no code execution, log entry `failed`.

## Large File

- Input: file close to 50 MB, PDF up to 500 pages, XLSX up to 20 sheets.
- Expected: async processing, UI loading state visible, no automatic downstream update.
- Boundary: files over 50 MB are rejected before parsing.
