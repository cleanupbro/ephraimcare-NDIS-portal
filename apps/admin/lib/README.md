# Admin Lib — Business Logic & Utilities

Domain-specific logic, Zod schemas, API integrations, and helper functions.

## Folders

### `incidents/`
- `constants.ts` — NDIA incident severity levels, categories, reporting requirements
- `schemas.ts` — Zod validation for incident report forms

### `invoices/`
- `calculations.ts` — Core billing logic:
  - `calculateBillableMinutes()` — min(scheduled, actual) duration
  - `getDayType()` — weekday/saturday/sunday/public_holiday classification
  - `getRate()` — Select rate tier based on day type
  - `calculateLineTotal()` — hours x rate
  - `calculateInvoiceTotals()` — subtotal + GST (10%) + total
- `constants.ts` — GST_RATE, LINE_ITEM_TYPES
- `csv-export.ts` — Convert invoices to CSV format
- `excel-export.ts` — Export to Excel with formatting
- `pdf-export.ts` — Generate PDF invoices
- `schemas.ts` — Zod invoice form validation
- `types.ts` — TypeScript types for invoicing domain

### `ndia/`
- `generate-claim-csv.ts` — NDIA PACE-compliant CSV export format

### `notifications/`
- `index.ts` — Notification orchestration
- `send-email.ts` — Resend email integration (fire-and-forget, uses `ADMIN_EMAIL` env var)
- `templates.ts` — HTML email templates (shift assignment, cancellation, invoice)
- `types.ts` — Notification type definitions

### `participants/`
- `form-store.ts` — Zustand store for 4-step participant form state
- `schemas.ts` — Zod validation: basicInfo, planDetails, contacts, supportNeeds

### `reports/`
- `accounting-formats.ts` — BAS/accounting export helpers
- `constants.ts` — Report types, date range presets
- `csv-export.ts` / `excel-export.ts` / `pdf-export.ts` — Export formatters
- `types.ts` — Report data structures

### `shifts/`
- `constants.ts` — TIME_SLOTS (06:00-20:00 in 30min), DURATION_PRESETS (2/4/6/8 hours)
- `schemas.ts` — Zod shift creation/edit validation
- `send-shift-notifications.ts` — SMS + email reminders (24h and 2h before)

### `sms/`
- `send-sms.ts` — Twilio integration
- `templates.ts` — SMS message templates

### `supabase/`
- `client.ts` — Browser-safe Supabase client
- `server.ts` — Server-side auth client with cookies
- `middleware.ts` — Auth middleware for protected routes
- `helpers.ts` — `isPlatformAdmin()`, `getOrganizationSettings()`, `getCurrentUserOrganizationId()`
- `schemas.ts` — RLS policy type definitions

### `workers/`
- `constants.ts` — SUPPORT_TYPES, QUALIFICATIONS, compliance level thresholds
- `schemas.ts` — Zod worker form validation

### `xero/`
- `client.ts` — Xero OAuth2 client setup
- `sync-invoice.ts` — Push finalized invoices to Xero accounting

### `toast.ts`
Toast notification helper wrapping shadcn/ui toaster.
