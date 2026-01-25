---
phase: 07-invoicing
verified: 2026-01-25T01:35:55Z
status: passed
score: 5/5 must-haves verified
---

# Phase 7: Invoicing Verification Report

**Phase Goal:** Admin can generate accurate invoices from completed shifts using the lesser-of-scheduled-vs-actual billing rule, with GST, PDF export, and NDIS bulk payment CSV generation.

**Verified:** 2026-01-25T01:35:55Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can select a participant and date range, generate an invoice, and see correct line items from completed shifts | ✓ VERIFIED | Generate page exists (222 lines), has participant selector, date range inputs, calls useGenerateInvoice hook which POSTs to /api/invoices/generate. API fetches completed shifts, creates invoice + line items, returns invoice ID for redirect. |
| 2 | Invoice billing uses the lesser of scheduled vs actual duration (verifiable by comparing a shift where actual was shorter) | ✓ VERIFIED | calculateBillableMinutes() in calculations.ts (lines 13-22) explicitly implements Math.min(scheduledMinutes, actualMinutes). Used in generate API (line 178). |
| 3 | Admin can finalize an invoice and it becomes locked (no edit button, no mutation possible) | ✓ VERIFIED | Finalize API (/api/invoices/[id]/finalize/route.ts) sets status='submitted', finalized_at, finalized_by. Trigger prevent_finalized_invoice_edit (migration lines 120-130) blocks UPDATE when status IN ('submitted', 'paid'). Invoice detail page (lines 84-86) checks isFinalized and shows lock notice (lines 186-191), hides edit buttons. |
| 4 | Finalized invoice can be downloaded as a branded PDF with correct GST calculation | ✓ VERIFIED | PDF API route exists (/api/invoices/[id]/pdf/route.ts), uses @react-pdf/renderer. InvoicePDF component (183 lines) renders EPHRAIM_CARE_DETAILS (ABN, address, phone, email), participant info, line items table, shows GST at 10% (line 159), total (line 164). GST calculation in calculations.ts (line 85): subtotal * GST_RATE (0.10). |
| 5 | Admin can generate a PACE-compliant bulk payment CSV covering multiple invoices | ✓ VERIFIED | CSV export API (/api/invoices/export-csv/route.ts) accepts invoice_ids array, calls generatePaceCsv. csv-export.ts exports PACE_CSV_HEADERS (exactly 16 columns, lines 6-23) and generatePaceCsv function (lines 49-86) with correct format: RegistrationNumber, NDISNumber, SupportsDeliveredFrom, SupportsDeliveredTo, SupportNumber (NDIS item), ClaimReference (invoice #), Quantity (hours), UnitPrice, GSTCode (P1), ABN. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/admin/lib/invoices/calculations.ts` | Billing calculations including lesser-of rule | ✓ VERIFIED | 105 lines. Exports calculateBillableMinutes (Math.min of scheduled vs actual), getDayType (checks holidays first, then sat/sun, default weekday), getRate (switch on dayType), calculateLineTotal (billable_minutes/60 * rate, rounded), calculateInvoiceTotals (subtotal + 10% GST). No stub patterns. |
| `apps/admin/lib/invoices/csv-export.ts` | PACE CSV generation | ✓ VERIFIED | 87 lines. PACE_CSV_HEADERS array with exactly 16 columns. generatePaceCsv function creates header + data rows with correct mapping. Uses EPHRAIM_CARE_ABN (no spaces), PACE_GST_CODE (P1). No stub patterns. |
| `apps/admin/app/api/invoices/generate/route.ts` | Invoice generation API | ✓ VERIFIED | 300 lines. POST handler with auth check, fetches completed shifts in date range, fetches rates, fetches holidays, calls next_invoice_number RPC, builds line items with calculateBillableMinutes, getDayType, getRate, inserts invoice + line items. Returns 201 with invoice data. No stub patterns. |
| `apps/admin/app/api/invoices/[id]/finalize/route.ts` | Finalization API | ✓ VERIFIED | 96 lines. POST handler checks auth, verifies invoice exists and status='draft', updates to status='submitted' with finalized_at and finalized_by. Returns success. No stub patterns. |
| `apps/admin/app/api/invoices/[id]/pdf/route.ts` | PDF generation API | ✓ VERIFIED | 124 lines. GET handler fetches invoice with line items and participant, calls InvoicePDF component, generates blob via @react-pdf/renderer, returns PDF with Content-Disposition header. No stub patterns. |
| `apps/admin/app/api/invoices/export-csv/route.ts` | CSV export API | ✓ VERIFIED | 124 lines. POST handler fetches selected invoices (only submitted/paid), transforms to PaceCsvInvoice format, calls generatePaceCsv, returns CSV with text/csv content type. No stub patterns. |
| `apps/admin/app/(protected)/invoices/page.tsx` | Invoice list | ✓ VERIFIED | 180 lines. Uses useInvoices hook, shows table with invoice #, participant, period, date, total, status. Has tabs for filtering by status. Links to detail pages. ExportCsvButton for bulk export. No stub patterns. |
| `apps/admin/app/(protected)/invoices/[id]/page.tsx` | Invoice detail | ✓ VERIFIED | 198 lines. Uses useInvoice hook to fetch invoice + line items. Shows InvoicePreview. Draft state: shows finalize + delete buttons. Finalized state: shows lock notice, no edit buttons, shows ExportCsvButton. No stub patterns. |
| `apps/admin/app/(protected)/invoices/generate/page.tsx` | Generation form | ✓ VERIFIED | 222 lines. Participant selector (fetches active participants), date range inputs (defaults to previous month), validation with react-hook-form + Zod, calls useGenerateInvoice mutation, redirects to /invoices/[id] on success. No stub patterns. |
| `apps/admin/app/(protected)/settings/rates/page.tsx` | Rate configuration | ✓ VERIFIED | 328 lines. Table showing support_type, weekday/saturday/sunday/public_holiday rates. Add/edit dialogs with RateForm. Uses useRates, useCreateRate, useUpdateRate hooks. Validates with supportTypeRateSchema. No stub patterns. |
| `apps/admin/app/(protected)/settings/holidays/page.tsx` | Holiday configuration | ✓ VERIFIED | 223 lines. List of public holidays with date + name. Add dialog with HolidayForm. Delete confirmation. Uses useHolidays, useCreateHoliday, useDeleteHoliday hooks. Validates with publicHolidaySchema. No stub patterns. |
| `apps/admin/components/pdf/InvoicePDF.tsx` | PDF document component | ✓ VERIFIED | 183 lines. React-pdf Document with Page, View, Text components. Header with company name + ABN, invoice number, date, period. From/To section. Line items table (date, service, day type, hours, rate, total). Totals section (subtotal, GST 10%, total). Draft watermark. Footer with OpBros. No stub patterns. |
| `supabase/migrations/20260125100001_invoicing_phase7.sql` | DB migration | ✓ VERIFIED | 228 lines. Adds columns to invoices (period_start, period_end, finalized_at, finalized_by) and invoice_line_items (support_type, day_type, scheduled_minutes, actual_minutes, billable_minutes). Creates support_type_rates, public_holidays, invoice_number_counter tables. Drops old invoice trigger/function. Creates next_invoice_number RPC (returns 'INV-' || year || '-' || lpad(sequence, 3, '0')). Creates prevent_finalized_invoice_edit trigger (blocks UPDATE when status IN ('submitted', 'paid')). RLS policies for new tables. |
| `apps/admin/lib/invoices/types.ts` | TypeScript types | ✓ VERIFIED | 115 lines. Exports DayType, InvoiceStatus, SupportTypeRate, PublicHoliday, Invoice, InvoiceLineItem, InvoiceWithLineItems, InvoiceWithParticipant, GenerateInvoicePayload, InvoiceGenerationResult. No runtime code. |
| `apps/admin/lib/invoices/schemas.ts` | Zod schemas | ✓ VERIFIED | 50 lines. Exports generateInvoiceSchema (participant_id, period_start, period_end with date validation), supportTypeRateSchema (all 4 rate tiers + effective_from), publicHolidaySchema (holiday_date, name), finalizeInvoiceSchema. Type inferences exported. |
| `apps/admin/lib/invoices/constants.ts` | Constants | ✓ VERIFIED | 75 lines. Exports GST_RATE (0.10), EPHRAIM_CARE_ABN (no spaces for CSV), EPHRAIM_CARE_ABN_DISPLAY (with spaces), EPHRAIM_CARE_DETAILS (name, ABN, phone, email, address), INVOICE_STATUS_COLORS (6 statuses with border/badge/text colors), DAY_TYPE_LABELS, PACE_GST_CODE (P1). |
| `apps/admin/hooks/use-invoices.ts` | Invoice hooks | ✓ VERIFIED | 203 lines. Exports useInvoices (fetches list with participant join, optional status filter), useInvoice (fetches single with line items), useGenerateInvoice (POSTs to /api/invoices/generate, invalidates queries, toasts), useFinalizeInvoice (POSTs to /api/invoices/[id]/finalize), useDeleteInvoice (deletes line items + invoice). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Generate page | useGenerateInvoice hook | Import + call | ✓ WIRED | Line 36 imports, line 50 calls useGenerateInvoice(), line 95 calls generateInvoice(data) in onSubmit |
| useGenerateInvoice | /api/invoices/generate | fetch POST | ✓ WIRED | Line 90 POSTs to /api/invoices/generate with JSON body |
| Generate API | calculateBillableMinutes | Import + call | ✓ WIRED | Line 6 imports from calculations.ts, line 178 calls calculateBillableMinutes(scheduledStart, scheduledEnd, actualStart, actualEnd) |
| Generate API | next_invoice_number RPC | supabase.rpc call | ✓ WIRED | Line 126-128 calls supabase.rpc('next_invoice_number', { p_organization_id: orgId }) |
| Generate API | Invoice + line items insert | Supabase insert | ✓ WIRED | Lines 234-250 insert invoice, lines 260-279 insert line items (maps over lineItems array built from shifts) |
| Invoice detail page | useFinalizeInvoice hook | Import + call | ✓ WIRED | Line 20 imports, line 30 calls useFinalizeInvoice(), line 37 calls finalizeMutation.mutate(id) |
| Invoice detail page | InvoicePreview component | Import + render | ✓ WIRED | Line 21 imports, line 194 renders <InvoicePreview invoice={invoice} /> |
| PDF API | InvoicePDF component | Import + call | ✓ WIRED | Line 5 imports InvoicePDF, line 89 calls InvoicePDF({ invoice: invoiceData }), line 90 passes to pdf() |
| CSV export API | generatePaceCsv | Import + call | ✓ WIRED | Line 3 imports generatePaceCsv, line 104 calls generatePaceCsv(paceCsvInvoices, registration_number) |
| Prevent edit trigger | Invoices table | BEFORE UPDATE trigger | ✓ WIRED | Migration lines 135-138 create trigger on invoices table executing prevent_finalized_invoice_edit() |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| INVC-01: Admin can generate invoice for a participant within a specified date range | ✓ SATISFIED | Generate page (participant selector + date range) + API (fetches shifts in range) verified |
| INVC-02: Invoice calculates billable hours as lesser of scheduled duration vs actual check-in/out duration | ✓ SATISFIED | calculateBillableMinutes uses Math.min(scheduledMinutes, actualMinutes) — verified in code |
| INVC-03: Invoice uses exact minutes for billing (no rounding applied) | ✓ SATISFIED | calculateBillableMinutes returns raw differenceInMinutes result, no rounding. Line total rounds only final currency amount (line 70), not minutes |
| INVC-04: Invoice multiplies billable hours by the configured rate for each support type | ✓ SATISFIED | calculateLineTotal (line 68-71) converts minutes to hours, multiplies by hourlyRate. getRate selects correct tier. Used in generate API line 201 |
| INVC-05: Invoice displays line items with date, service type, hours, rate, and line total | ✓ SATISFIED | InvoicePreview and InvoicePDF components render line items table. DB schema has support_type, billable_minutes, unit_price, line_total columns |
| INVC-06: Invoice calculates GST at 10% on subtotal | ✓ SATISFIED | calculateInvoiceTotals (line 85): gst = Math.round(subtotal * GST_RATE * 100) / 100, where GST_RATE = 0.10. Rendered in PDF line 159-160 |
| INVC-07: Invoice receives unique sequential number in INV-YYYY-NNN format | ✓ SATISFIED | next_invoice_number() function (migration line 113): 'INV-' || v_year::text || '-' || lpad(v_sequence::text, 3, '0'). Uses ON CONFLICT DO UPDATE for gapless counter |
| INVC-08: Admin can approve/finalize invoice (status: draft to final) | ✓ SATISFIED | Finalize API changes status from 'draft' to 'submitted' (line 67), sets finalized_at and finalized_by. Invoice detail page shows finalize button for drafts (line 139-144) |
| INVC-09: Finalized invoices cannot be edited (locked) | ✓ SATISFIED | Trigger prevent_finalized_invoice_edit raises exception when OLD.status IN ('submitted', 'paid'). Detail page hides edit buttons when isFinalized (line 85-86, 101-174) |
| INVC-10: Admin can configure support type hourly rates in settings page | ✓ SATISFIED | Settings/rates page exists (328 lines) with table + add/edit forms for weekday/saturday/sunday/public_holiday rates. Uses support_type_rates table |
| INVC-11: Invoice exportable as PDF with Ephraim Care branding (logo, ABN, colors) | ✓ SATISFIED | PDF API + InvoicePDF component render branded PDF with EPHRAIM_CARE_DETAILS (ABN, address, phone, email). Styled with pdf-styles.ts. Includes "Powered by OpBros" footer |
| INVC-12: System generates NDIS Bulk Payment CSV in PACE-compliant format | ✓ SATISFIED | CSV export API + generatePaceCsv produce exactly 16 columns matching PACE_CSV_HEADERS. Uses EPHRAIM_CARE_ABN (no spaces), PACE_GST_CODE (P1), correct quantity/unit price formatting |

**All 12 requirements satisfied**

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | - | - | - | No anti-patterns detected |

**Scanned files:**
- apps/admin/lib/invoices/*.ts (5 files)
- apps/admin/app/api/invoices/**/*.ts (4 files)
- apps/admin/app/(protected)/invoices/**/*.tsx (4 files)
- apps/admin/app/(protected)/settings/{rates,holidays}/*.tsx (2 files)
- apps/admin/components/pdf/*.tsx (1 file)
- apps/admin/hooks/use-invoices.ts

**Anti-pattern checks:**
- ✓ No TODO/FIXME/PLACEHOLDER comments found
- ✓ No console.log-only implementations
- ✓ No empty return statements (return null/{}/ [])
- ✓ All components > 15 lines (substantive)
- ✓ All API routes > 10 lines (substantive)
- ✓ All functions have real implementations

### Human Verification Required

#### 1. Generate invoice with lesser-of billing verification

**Test:** Create a shift scheduled for 2 hours (e.g., 9:00-11:00). Worker checks in at 9:00, checks out at 10:30 (1.5 hours actual). Generate an invoice covering this shift.

**Expected:** Invoice line item shows billable_minutes = 90 (1.5 hours), quantity = 1.50, and the line total reflects 1.5 hours * hourly rate (not 2 hours).

**Why human:** Need to verify the lesser-of rule with real data. Automated verification confirmed the code logic (Math.min) but human should test the full flow with actual shift data.

#### 2. Finalized invoice lock enforcement

**Test:** Generate and finalize an invoice. Attempt to update it via the database (UPDATE invoices SET total = 999 WHERE id = '...') or via a direct API call (PUT /api/invoices/[id]).

**Expected:** Database UPDATE raises exception "Cannot modify a finalized invoice". API rejects the request or is blocked by RLS/trigger.

**Why human:** Need to verify the trigger actually fires and prevents modification. Automated verification confirmed the trigger exists and has correct logic.

#### 3. PDF export visual verification

**Test:** Generate and finalize an invoice. Download the PDF. Check branding, formatting, GST calculation display, and layout.

**Expected:** PDF displays Ephraim Care Pty Ltd, ABN 76 685 693 565, address, phone, email. Line items table is readable. Subtotal + GST (10%) + Total are correctly formatted. Footer shows "Powered by OpBros".

**Why human:** Visual layout and branding require human review. Automated verification confirmed PDF component has all required elements but can't verify visual appearance.

#### 4. PACE CSV format compliance

**Test:** Generate multiple invoices, finalize them, export as PACE CSV. Open in Excel. Check column count (exactly 16), headers match PACE spec, data in correct columns, ABN without spaces, quantity is decimal hours.

**Expected:** 16 columns with correct headers. RegistrationNumber, NDISNumber, SupportsDeliveredFrom/To (dates), SupportNumber (NDIS item), ClaimReference (INV-YYYY-NNN), Quantity (hours as decimal), UnitPrice, GSTCode (P1), ABN (no spaces). Import into PACE portal succeeds.

**Why human:** CSV compliance with NDIS PACE portal requires real data upload test. Automated verification confirmed the format matches spec but can't test actual import.

#### 5. Invoice number gapless sequence

**Test:** Generate 5 invoices in rapid succession (same year). Check invoice numbers.

**Expected:** Sequential numbers with no gaps: INV-2026-001, INV-2026-002, INV-2026-003, INV-2026-004, INV-2026-005 (even if generated concurrently).

**Why human:** Need to verify the ON CONFLICT DO UPDATE pattern ensures atomic increment with no race conditions. Automated verification confirmed the RPC uses correct pattern but can't test concurrency.

### Gaps Summary

**None.** All must-haves verified. All artifacts exist, are substantive (adequate line count, no stub patterns), and are correctly wired (imports present, functions called, data flows verified).

**Human verification items are for testing runtime behavior with real data, not code gaps.**

---

_Verified: 2026-01-25T01:35:55Z_
_Verifier: Claude (gsd-verifier)_
