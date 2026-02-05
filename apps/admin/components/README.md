# Admin Components

UI components organized by domain. All use shadcn/ui primitives from `@ephraimcare/ui`.

## Folders

### `compliance/`
- `compliance-breakdown.tsx` — Compliance score widget with category breakdown
- `health-score-card.tsx` — Health score display (green/yellow/red)

### `dashboard/`
- `compliance-widget.tsx` — Dashboard compliance summary card
- Revenue, shifts, and worker stats widgets

### `goals/`
- `GoalCard.tsx` — Individual NDIS goal display
- `GoalProgressModal.tsx` — Update goal progress modal

### `incidents/`
- `incident-detail.tsx` — Full incident report view
- `incident-form.tsx` — Create/edit incident report form
- `ndia-countdown.tsx` — NDIA 5-day reporting deadline countdown
- `ndia-report-dialog.tsx` — NDIA report submission dialog

### `invoices/`
- `ExportCsvButton.tsx` — Export invoices as CSV
- `InvoicePreview.tsx` — Invoice preview modal
- `LineItemsTable.tsx` — Invoice line items table (shift-by-shift billing)
- `NdiaCsvExport.tsx` — NDIA PACE format CSV export

### `participants/`
- `participant-list.tsx` — Participant table with search/filter
- `participant-detail.tsx` — Full profile view with tabs
- `participant-edit-form.tsx` — Edit participant form
- `participant-form/` — 4-step creation wizard:
  - `step-basic-info.tsx` — Name, DOB, NDIS number
  - `step-plan-details.tsx` — Plan dates, budget
  - `step-contacts.tsx` — Address, emergency contact
  - `step-support-needs.tsx` — Notes, support requirements
- `participant-budget.tsx` — Budget progress bars
- `participant-search.tsx` — Search and filter controls
- `case-note-card.tsx` / `case-notes-tab.tsx` — Case note display
- `archive-dialog.tsx` — Archive confirmation dialog
- `participant-plan-badge.tsx` — Plan status indicator

### `pdf/`
- `InvoicePDF.tsx` — Invoice PDF layout (react-pdf renderer)
- `pdf-styles.ts` — Shared PDF styling constants

### `reports/`
- `DateRangePicker.tsx` — Date range selection component
- `ExportButtons.tsx` — Export as PDF/CSV/Excel buttons
- `ReportFilters.tsx` — Participant/worker/date filter bar
- `ReportLayout.tsx` — Report page container
- `charts/` — Recharts visualizations:
  - `BudgetBarChart.tsx` — Budget allocation bar chart
  - `ChartCard.tsx` — Chart container card
  - `RevenueLineChart.tsx` — Revenue trend line chart
- `pdf/ReportPdfDocument.tsx` — PDF report layout

### `shifts/`
- `shift-form.tsx` — Create/edit shift form (time, participant, worker, service type)
- `shift-list.tsx` — Shift table view
- `shift-card.tsx` — Shift summary card
- `shift-detail-sheet.tsx` — Side panel shift details
- `shift-filters.tsx` — Date/participant/worker filter bar
- `shift-week-nav.tsx` — Week navigation (prev/next buttons)
- `calendar-view.tsx` — Calendar grid view
- `shift-cancel-dialog.tsx` — Cancellation reason dialog
- `shift-conflict-dialog.tsx` — Scheduling conflict warning
- `BulkShiftWizard.tsx` — Multi-shift creation wizard
- `BulkShiftPreview.tsx` — Preview bulk shifts before creation
- `recurring-shift-form.tsx` — Recurring shift template form

### `workers/`
- `worker-list.tsx` — Worker table with compliance indicators
- `worker-detail.tsx` — Worker profile view
- `worker-edit-form.tsx` — Edit worker form
- `worker-form/index.tsx` — Worker creation/invite form
- `worker-compliance.tsx` — Compliance status checklist
- `worker-search.tsx` — Search/filter controls
- `worker-stats.tsx` — Hours and earnings statistics
- `worker-columns.tsx` — Table column definitions

### `ui/`
- `data-table.tsx` — Generic TanStack Table component
- `toaster.tsx` — Toast notification component
