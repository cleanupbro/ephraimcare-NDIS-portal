---
phase: 07-invoicing
plan: 06
subsystem: invoicing-pdf
tags: [react-pdf, pdf-export, invoice-rendering, fonts, branding]
requires: ["07-02", "07-05"]
provides: ["pdf-api", "invoice-pdf-component", "pdf-styles"]
affects: ["invoice-detail-page", "ndis-submission-workflow"]
tech-stack:
  added: ["@react-pdf/renderer"]
  patterns: ["server-side-pdf-generation", "font-registration", "blob-to-arraybuffer"]
key-files:
  created:
    - apps/admin/app/api/invoices/[id]/pdf/route.ts
    - apps/admin/components/pdf/InvoicePDF.tsx
    - apps/admin/components/pdf/pdf-styles.ts
    - apps/admin/public/fonts/Inter-Regular.ttf
    - apps/admin/public/fonts/Inter-Medium.ttf
    - apps/admin/public/fonts/Inter-Bold.ttf
    - apps/admin/public/images/ephraim-care-logo.png
  modified:
    - apps/admin/next.config.ts
    - apps/admin/package.json
    - pnpm-lock.yaml
decisions:
  - id: pdf-blob-arraybuffer
    choice: "Use toBlob() + arrayBuffer() instead of toBuffer()"
    reason: "toBuffer() returns ReadableStream in some environments; toBlob().arrayBuffer() is more portable"
  - id: component-as-function
    choice: "Call InvoicePDF({ invoice }) directly instead of createElement"
    reason: "pdf() expects Document element directly; calling component as function returns the element"
  - id: placeholder-logo
    choice: "Create simple green PNG placeholder"
    reason: "Real Ephraim Care logo should replace this file"
  - id: fontsource-cdn
    choice: "Download fonts from jsDelivr fontsource CDN"
    reason: "Google Fonts and GitHub LFS don't allow direct curl downloads"
metrics:
  duration: 7m
  completed: 2026-01-25
---

# Phase 7 Plan 06: PDF Export Summary

**One-liner:** PDF export API using @react-pdf/renderer with Ephraim Care branding, Inter fonts, and downloadable invoice PDFs.

## What Was Built

### API Route: `/api/invoices/[id]/pdf`

- **Runtime:** Node.js (required for @react-pdf/renderer)
- **Method:** GET
- **Auth:** Admin/coordinator only
- **Response:** PDF file download with Content-Disposition header
- **Filename:** Invoice number (e.g., `INV-2026-001.pdf`)

### PDF Document Component

**InvoicePDF.tsx (183 lines):**
- Header with company name and invoice title
- ABN displayed in header section
- From section: Ephraim Care details (name, address, phone, email)
- Bill To section: Participant name and NDIS number
- Line items table with columns: Date, Service, Day Type, Hours, Rate, Total
- Totals section: Subtotal, GST (10%), Total Due
- Footer: "Powered by OpBros"
- DRAFT watermark for draft invoices (status === 'draft')

### PDF Styles

**pdf-styles.ts:**
- Font.register for Inter (Regular, Medium, Bold weights)
- Ephraim Care brand colors: Green (#66BB6A), Teal (#00BFA5)
- StyleSheet.create with:
  - Page layout (A4, 40px padding)
  - Header styles
  - From/To section styles
  - Table header and row styles
  - Column width definitions
  - Totals section styles
  - Footer styles
  - Draft watermark (rotated, semi-transparent)

### Next.js Configuration

- Added `serverExternalPackages: ['@react-pdf/renderer']`
- Ensures @react-pdf/renderer runs in Node.js context, not bundled by webpack

### Assets

**Fonts (public/fonts/):**
- Inter-Regular.ttf (400 weight)
- Inter-Medium.ttf (500 weight)
- Inter-Bold.ttf (700 weight)
- Downloaded from jsDelivr fontsource CDN

**Logo (public/images/):**
- ephraim-care-logo.png (200x60 green placeholder)
- **NOTE:** Replace with actual Ephraim Care logo

## Key Implementation Details

### PDF Generation Flow

1. Auth check (admin/coordinator)
2. Fetch invoice with line items and participant
3. Transform data (rename `invoice_line_items` to `line_items`)
4. Call `InvoicePDF({ invoice })` to get Document element
5. Call `pdf(element).toBlob()` for PDF generation
6. Convert blob to ArrayBuffer
7. Return Response with PDF headers

### Type Handling

- Used `(supabase.from('invoices') as any)` for PostgREST query (established pattern)
- Called component as function to satisfy pdf() type requirements

### Font Graceful Fallback

- Font.register wrapped in try/catch
- Falls back to Helvetica if fonts not found
- Logs warning for debugging

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 90c4812 | chore | Install @react-pdf/renderer and setup PDF assets |
| 8c6ce70 | feat | Implement PDF export for invoices |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status |
|-------|--------|
| @react-pdf/renderer in package.json | PASS |
| serverExternalPackages in next.config.ts | PASS |
| runtime = 'nodejs' in route.ts | PASS |
| Font.register in pdf-styles.ts | PASS |
| EPHRAIM_CARE_DETAILS in InvoicePDF.tsx | PASS |
| 'Powered by OpBros' in footer | PASS |
| Brand colors #66BB6A and #00BFA5 | PASS |
| Font files in public/fonts/ | PASS |
| InvoicePDF.tsx > 100 lines (183) | PASS |

## Notes for Future

1. **Replace placeholder logo** - ephraim-care-logo.png is a green rectangle placeholder
2. **Logo in PDF** - Currently uses text only; can add Image component when real logo is available
3. **NDIS item numbers** - Line items include `ndis_item_number` field but not currently displayed in PDF (could be added to table if needed for NDIS submission)
4. **Payment terms** - Could add bank details section for payment instructions
