---
phase: 12-reporting-and-export
plan: 05
subsystem: reporting
tags: [excel, pdf, export, sheetjs, react-pdf]
depends:
  requires: [12-02, 12-03, 12-04]
  provides: [excel-export-helper, pdf-report-template]
  affects: [future-reports]
tech-stack:
  added: []
  patterns: [generic-pdf-template, excel-auto-column-sizing]
key-files:
  created:
    - apps/admin/lib/reports/excel-export.ts
    - apps/admin/lib/reports/pdf-export.ts
    - apps/admin/components/reports/pdf/ReportPdfDocument.tsx
  modified:
    - apps/admin/app/(protected)/reports/budget/page.tsx
    - apps/admin/app/(protected)/reports/revenue/page.tsx
    - apps/admin/app/(protected)/reports/worker-hours/page.tsx
    - apps/admin/app/(protected)/reports/participant-activity/page.tsx
decisions:
  - id: excel-export-pattern
    choice: "SheetJS with auto-column sizing based on content width"
  - id: pdf-report-template
    choice: "Generic ReportPdfDocument component reusing invoice brand colors"
  - id: pdf-columns-type
    choice: "ReportColumn interface with width/align/format for PDF customization"
metrics:
  duration: 4m
  completed: 2026-01-27
---

# Phase 12 Plan 05: Excel and PDF Export Summary

**One-liner:** SheetJS Excel export + generic PDF report template using react-pdf renderer with Ephraim Care branding

## What Was Built

### Excel Export Helper (excel-export.ts)
- `generateExcelWorkbook()` - Creates SheetJS workbook from typed data + CsvColumn definitions
- `exportToExcel()` - One-step export and download with .xlsx extension
- Auto-column sizing based on maximum content width (capped at 50 chars)
- Reuses same CsvColumn interface as CSV export for consistency

### PDF Export Utilities (pdf-export.ts)
- `generateReportPdf()` - Generates PDF blob from React PDF document
- `downloadPdf()` - One-step PDF generation and browser download
- Async functions using react-pdf's `pdf().toBlob()` pattern

### Generic PDF Report Template (ReportPdfDocument.tsx)
- 357-line component with full Ephraim Care branding
- Header: Company name, ABN, address, report title, date range, generation timestamp
- Summary cards: Up to 4 key metrics with teal accent border
- Data table: Alternating row colors, configurable column widths and alignment
- Footer: "Powered by OpBros" branding
- Reuses Inter fonts and brand colors from invoice PDF styles

### Report Page Updates
All 4 report pages updated with working Excel/PDF export:
- Budget Utilization Report
- Revenue Trends Report
- Worker Hours Report
- Participant Activity Report

Each page now has:
- PDF_COLUMNS definition with column widths and alignment
- handleExport updated with excel and pdf branches
- JSX integration with ReportPdfDocument component

## Key Patterns

### CsvColumn Reuse
```typescript
// Same interface works for CSV, Excel, and PDF (key subset)
interface CsvColumn<T> {
  header: string
  key: keyof T
  format?: (value: T[keyof T]) => string
}
```

### PDF Column Extension
```typescript
// PDF adds width and alignment options
interface ReportColumn<T> {
  header: string
  key: keyof T
  width?: string      // e.g., '25%'
  align?: 'left' | 'right' | 'center'
  format?: (value: unknown) => string
}
```

### Export Handler Pattern
```typescript
function handleExport(exportFormat: ExportFormat) {
  const filename = `report-${format(dateRange.from, 'yyyy-MM-dd')}`

  if (exportFormat === 'csv') {
    downloadCsv(generateCsv(data, CSV_COLUMNS), filename)
  } else if (exportFormat === 'excel') {
    exportToExcel(data, CSV_COLUMNS, filename, 'Sheet Name')
  } else if (exportFormat === 'pdf') {
    downloadPdf(<ReportPdfDocument {...props} />, filename)
  }
}
```

## Verification Results

| Criterion | Status |
|-----------|--------|
| 4 reports can export to Excel | Pass |
| Excel files have .xlsx format | Pass |
| Excel columns auto-sized | Pass |
| 4 reports can export to PDF | Pass |
| PDFs show Ephraim Care branding | Pass |
| PDFs display title, date range, summaries, data table | Pass |
| PDFs use Inter fonts and brand colors | Pass |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| ddd72d9 | feat | Create Excel export helper with SheetJS |
| 2003ec9 | feat | Create PDF report template and utilities |
| 2f118d1 | feat | Wire Excel/PDF export to budget and revenue reports |
| 10d4d8f | feat | Wire Excel/PDF export to worker hours and participant activity reports |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Phase 12 reporting infrastructure now complete:
- Plan 01: ReportLayout, CSV export, date range presets
- Plan 02: Budget report with bar chart
- Plan 03: Revenue report with line chart
- Plan 04: Worker hours and participant activity reports
- Plan 05: Excel and PDF export for all reports

Ready for Plan 06 (if any) or Phase 13 Scale Features.
