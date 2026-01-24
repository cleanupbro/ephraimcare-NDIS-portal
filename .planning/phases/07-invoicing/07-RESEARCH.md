# Phase 7: Invoicing - Research

**Researched:** 2026-01-25
**Domain:** NDIS Invoicing, PDF Generation, Billing Calculations, PACE CSV Export
**Confidence:** HIGH (verified with official NDIS sources + existing codebase patterns)

## Summary

Phase 7 implements invoice generation from completed shifts for NDIS participants. The system calculates billable hours using the lesser-of-scheduled-vs-actual rule, applies tiered rates (weekday/Saturday/Sunday/public holiday), generates branded PDFs, and exports PACE-compliant bulk payment CSV files.

Key findings:
- Most NDIS disability support services are **GST-free** under ATO section 38-38, not GST-inclusive at 10%. However, the CONTEXT.md requirement INVC-06 explicitly states "GST at 10% on subtotal" -- this suggests Ephraim Care's specific services may include taxable items, or the client has decided to apply GST regardless. **Follow the requirement as stated.**
- The existing `invoices` and `invoice_line_items` tables are already created but need schema additions for tiered rates, period tracking, and the finalization lock.
- `@react-pdf/renderer` v4.3.x is the recommended PDF library -- it supports React 19, works server-side in Next.js 15 route handlers, and uses a component-based API familiar to the team.
- The existing invoice number trigger uses `INV-YYYYMM-NNNN` format but the requirement specifies `INV-YYYY-NNN`. The trigger needs replacing with a gapless counter approach.
- NDIS bulk payment CSV has 16 columns with specific formatting rules. The `GSTCode` field uses P1 (taxable) or P2 (GST-free).

**Primary recommendation:** Use `@react-pdf/renderer` for PDF generation via a Next.js API route handler, implement a gapless counter table for invoice numbering, and create new `support_type_rates` and `public_holidays` tables for the tiered rate model.

## 1. NDIS/PACE Billing Standards

### NDIS Invoice Requirements (HIGH confidence)

NDIS invoices must include:
- Provider ABN (Australian Business Number)
- Unique invoice number
- Issue date
- Participant full name and NDIS number
- Detailed description of services: NDIS support item reference number, type of service, dates, quantity
- Total amount with GST breakdown (if applicable)
- Support item numbers from the NDIS Support Catalogue

### NDIS Support Item Number Format

Format: `XX_YYY_ZZZZ_A_B` with day-of-week suffixes:

| Suffix | Day Type |
|--------|----------|
| (none) | Weekday Daytime |
| `_S` | Saturday |
| `_U` | Sunday |
| `_P` | Public Holiday |
| `_E` | Evening |
| `_N` | Night |

**Examples (Category 01 - Assistance with Daily Life):**

| Code | Description | Rate (2024-25) |
|------|-------------|----------------|
| `01_011_0107_1_1` | Self-Care - Weekday Daytime | $70.23/hr |
| `01_011_0107_1_1_S` | Self-Care - Saturday | ~$98.32/hr |
| `01_011_0107_1_1_U` | Self-Care - Sunday | ~$126.41/hr |
| `01_011_0107_1_1_P` | Self-Care - Public Holiday | ~$154.51/hr |

### GST Rules for NDIS Services (HIGH confidence)

Per ATO section 38-38, NDIS services are GST-free when ALL four criteria are met:
1. Supply is to an NDIS participant with a plan in effect
2. Supply is reasonable and necessary (specified in plan)
3. Written agreement exists between provider and participant
4. Supply is covered by the GST-free determination tables

**For this implementation:** The requirement (INVC-06) explicitly specifies "GST at 10% on subtotal". Follow this requirement. The GST code in PACE CSV should be `P1` (tax claimable). If Ephraim Care later determines their services are GST-free, the rate can be set to 0% and CSV code changed to `P2`.

### PACE Bulk Payment CSV Format (HIGH confidence)

The official NDIS Bulk Payment Request CSV template has 16 columns:

| # | Column | Format | Required | Notes |
|---|--------|--------|----------|-------|
| 1 | RegistrationNumber | Numeric, up to 30 chars | Yes | Starts with '405' |
| 2 | NDISNumber | Numeric, up to 20 chars | Yes | Starts with '43' |
| 3 | SupportsDeliveredFrom | YYYY-MM-DD | Yes | Start date of support |
| 4 | SupportsDeliveredTo | YYYY-MM-DD | Yes | End date of support |
| 5 | SupportNumber | Up to 60 chars | Yes | NDIS item number (e.g. 01_011_0107_1_1) |
| 6 | ClaimReference | Up to 50 chars | Yes | Provider's invoice number |
| 7 | Quantity | Decimal | Yes | Hours as decimal (1h30m = 1.5) |
| 8 | Hours | Always blank | No | Legacy field, leave empty |
| 9 | UnitPrice | Decimal, GST-inclusive | Yes | Per-unit charge amount |
| 10 | GSTCode | P1, P2, or P5 | Yes | P1=taxable, P2=GST-free, P5=out-of-scope |
| 11 | AuthorisedBy | Blank | No | Legacy field |
| 12 | ParticipantApproved | Blank | No | Legacy field |
| 13 | InKindFundingProgram | Blank | No | Optional, leave blank |
| 14 | ClaimType | Text or blank | No | Blank=direct, CANC=cancellation, TRAN=travel |
| 15 | CancellationReason | Text | No | Only when ClaimType=CANC |
| 16 | ABN of Support Provider | Numeric, no spaces | Yes | Provider ABN |

**Critical CSV rules:**
- Save as CSV (not XLSX)
- Do not delete any columns even if blank
- Do not reopen in Excel after saving (corrupts date formats)
- Dates must be YYYY-MM-DD format
- ABN must have no spaces (76685693565)

## 2. PDF Generation Approach

### Recommended: @react-pdf/renderer (HIGH confidence)

| Attribute | Value |
|-----------|-------|
| Package | `@react-pdf/renderer` |
| Version | ^4.3.2 (latest) |
| React 19 support | Yes (since v4.1.0) |
| Server-side | Yes (via `pdf().toBuffer()` in route handlers) |
| Weekly downloads | 860,000+ |
| License | MIT |

**Why this over alternatives:**
- **vs Puppeteer:** No heavy browser dependency, no cold start issues, no memory overhead
- **vs pdfmake:** React component API matches team's existing patterns; type-safe JSX
- **vs PDFKit:** Higher-level API with automatic layout; less manual positioning

### Next.js 15 Route Handler Pattern

```typescript
// app/api/invoices/[id]/pdf/route.ts
import { pdf } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';

export const dynamic = 'force-dynamic';
// MUST use Node.js runtime, NOT edge
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch invoice data from Supabase
  const invoiceData = await fetchInvoiceData(id);

  // Generate PDF buffer
  const buffer = await pdf(<InvoicePDF invoice={invoiceData} />).toBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoiceData.invoice_number}.pdf"`,
    },
  });
}
```

### Next.js Config Required

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config
  serverExternalPackages: ['@react-pdf/renderer'],
}
```

### Known Issues & Mitigations

| Issue | Mitigation |
|-------|-----------|
| "Buffer is not defined" in edge runtime | Use `runtime = 'nodejs'` (not edge) |
| lineHeight regression in 4.1.3+ | Avoid `lineHeight` style, use `marginBottom` for spacing |
| Font registration on server | Use absolute file paths or URLs for .ttf files |
| No CSS grid support | Use flexbox with percentage widths for table layouts |
| No `<table>` element | Build tables with `<View style={{ flexDirection: 'row' }}>` |

### Font Registration

```typescript
import { Font } from '@react-pdf/renderer';

// Register custom fonts (TTF only, no variable fonts)
Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/Inter-Regular.ttf') },
    { src: path.join(process.cwd(), 'public/fonts/Inter-Medium.ttf'), fontWeight: 500 },
    { src: path.join(process.cwd(), 'public/fonts/Inter-Bold.ttf'), fontWeight: 700 },
  ],
});
```

### Invoice PDF Component Structure

```typescript
// Components hierarchy for the PDF
<Document>
  <Page size="A4" style={styles.page}>
    <InvoiceHeader />      {/* Logo + business details + branding colors */}
    <BillToSection />      {/* Participant name + NDIS number */}
    <InvoiceDetails />     {/* Invoice #, date, period */}
    <LineItemsTable />     {/* Date, service, hours, rate, total */}
    <TotalsSection />      {/* Subtotal, GST, Total */}
    <Footer />             {/* "Powered by OpBros" */}
  </Page>
</Document>
```

## 3. Database Schema Design

### Existing Tables (Already Created)

The following tables exist but need modifications:

**`invoices`** - needs additions:
- `period_start date` - invoice period start
- `period_end date` - invoice period end
- `finalized_at timestamptz` - when invoice was finalized (lock timestamp)
- `finalized_by uuid` - who finalized it

**`invoice_line_items`** - needs additions:
- `support_type text` - the support type for this line
- `day_type text` - weekday/saturday/sunday/public_holiday
- `scheduled_minutes integer` - original scheduled duration
- `actual_minutes integer` - actual check-in/out duration
- `billable_minutes integer` - lesser of scheduled vs actual

### New Tables Required

**`support_type_rates`** - tiered hourly rates per support type:

```sql
create table public.support_type_rates (
  id uuid primary key default gen_random_uuid(),
  support_type text not null,
  ndis_item_number text,           -- e.g. 01_011_0107_1_1
  weekday_rate decimal(10,2) not null,
  saturday_rate decimal(10,2) not null,
  sunday_rate decimal(10,2) not null,
  public_holiday_rate decimal(10,2) not null,
  effective_from date not null default current_date,
  is_active boolean default true,
  organization_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_support_type_org unique(support_type, organization_id, effective_from)
);
```

**`public_holidays`** - manually managed holiday dates:

```sql
create table public.public_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null,
  name text not null,              -- e.g. "Australia Day"
  organization_id uuid not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  constraint unique_holiday_date_org unique(holiday_date, organization_id)
);
```

**`invoice_number_counter`** - gapless sequential numbering:

```sql
create table public.invoice_number_counter (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  current_sequence integer not null default 0,
  organization_id uuid not null,
  constraint unique_year_org unique(year, organization_id)
);
```

### Invoice Number Generation Function (Gapless)

Replace the existing `generate_invoice_number()` trigger with a proper gapless approach:

```sql
create or replace function public.next_invoice_number(p_organization_id uuid)
returns text
language plpgsql
as $$
declare
  v_year integer;
  v_sequence integer;
begin
  v_year := extract(year from current_date);

  -- Upsert the counter row, incrementing atomically
  insert into invoice_number_counter (year, current_sequence, organization_id)
  values (v_year, 1, p_organization_id)
  on conflict (year, organization_id)
  do update set current_sequence = invoice_number_counter.current_sequence + 1
  returning current_sequence into v_sequence;

  return 'INV-' || v_year::text || '-' || lpad(v_sequence::text, 3, '0');
end;
$$;
```

**Why this pattern:**
- Row-level lock on the counter ensures no gaps
- `INSERT ... ON CONFLICT DO UPDATE` is atomic
- Concurrent transactions serialize on the row lock
- If a transaction rolls back, the counter is not incremented
- Performance is adequate for single-provider invoicing volumes

### RLS Policies (Already Exist)

The existing RLS policies are sufficient:
- `Admin/coordinator can manage invoices` - covers all CRUD
- `Participants can view their non-draft invoices` - read access for non-drafts
- `Admin/coordinator can manage line items` - line item CRUD
- New tables need similar org-scoped admin-only policies

### Preventing Edits on Finalized Invoices

Two-layer protection:

1. **Application layer:** Check `status !== 'draft'` before allowing mutations
2. **Database layer:** Add a trigger that prevents updates to finalized invoices:

```sql
create or replace function prevent_finalized_invoice_edit()
returns trigger as $$
begin
  if old.status in ('submitted', 'paid') then
    raise exception 'Cannot modify a finalized invoice';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_prevent_finalized_edit
  before update on invoices
  for each row
  execute function prevent_finalized_invoice_edit();
```

## 4. Billing Calculation Logic

### Lesser-of-Scheduled-vs-Actual Rule

```typescript
function calculateBillableMinutes(
  scheduledStart: Date,
  scheduledEnd: Date,
  actualCheckIn: Date,
  actualCheckOut: Date
): number {
  const scheduledMinutes = differenceInMinutes(scheduledEnd, scheduledStart);
  const actualMinutes = differenceInMinutes(actualCheckOut, actualCheckIn);

  // INVC-02: Lesser of scheduled vs actual
  // INVC-03: Exact minutes, no rounding
  return Math.min(scheduledMinutes, actualMinutes);
}
```

### Converting Minutes to Billable Hours

```typescript
// INVC-03: No rounding - use exact minutes converted to hours
function minutesToHours(minutes: number): number {
  return minutes / 60; // e.g. 95 minutes = 1.583333...
}

// For display: show to 2 decimal places
function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(2); // e.g. "1.58"
}
```

### Day Type Determination

```typescript
import { isSaturday, isSunday } from 'date-fns';

type DayType = 'weekday' | 'saturday' | 'sunday' | 'public_holiday';

async function getDayType(
  date: Date,
  publicHolidays: Date[]
): DayType {
  // Check public holidays first (overrides weekend)
  if (publicHolidays.some(h => isSameDay(h, date))) {
    return 'public_holiday';
  }
  if (isSaturday(date)) return 'saturday';
  if (isSunday(date)) return 'sunday';
  return 'weekday';
}
```

### Rate Selection

```typescript
function getRate(rates: SupportTypeRate, dayType: DayType): number {
  switch (dayType) {
    case 'weekday': return rates.weekday_rate;
    case 'saturday': return rates.saturday_rate;
    case 'sunday': return rates.sunday_rate;
    case 'public_holiday': return rates.public_holiday_rate;
  }
}
```

### Line Total Calculation

```typescript
function calculateLineTotal(billableMinutes: number, hourlyRate: number): number {
  const hours = billableMinutes / 60;
  // Round to 2 decimal places for currency
  return Math.round(hours * hourlyRate * 100) / 100;
}
```

### Invoice Totals

```typescript
function calculateInvoiceTotals(lineItems: LineItem[]) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  // INVC-06: GST at 10%
  const gst = Math.round(subtotal * 0.10 * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  return { subtotal, gst, total };
}
```

## 5. Rate Management

### Support Type Rates Table Design

Each support type has four rate tiers. The `effective_from` date allows rate versioning without breaking existing invoices.

**Key design decisions from CONTEXT.md:**
- Rate changes apply to future invoices only
- Existing draft invoices keep their original rates (rates are snapshotted at generation time into line items)
- Admin role only can edit rates

### Rate Snapshot Pattern

When generating an invoice, rates are copied into line items (via `unit_price`). This means:
- Draft invoices are immune to rate changes
- Historical invoices always show the rate that was current when generated
- No need to version-track which rate was used

### Settings Page Structure

The rates settings page should show:
- All support types in a table/card view
- Each with weekday, Saturday, Sunday, and public holiday rate columns
- Edit inline or via modal
- `effective_from` date picker (defaults to today)

### Public Holidays Management

Simple CRUD for holiday dates:
- Date picker + name field
- List of existing holidays (sortable by date)
- Delete capability
- No auto-detection (per CONTEXT.md decision)

## 6. Invoice Number Sequencing

### Format: INV-YYYY-NNN

| Component | Description | Example |
|-----------|-------------|---------|
| INV | Fixed prefix | INV |
| YYYY | Year of invoice creation | 2026 |
| NNN | Zero-padded sequential number | 001, 002, ..., 999 |

**Globally sequential** (not per-participant): All invoices share one counter per year.

### Existing Trigger Problem

The current trigger in the database uses `INV-YYYYMM-NNNN` (year+month, 4-digit sequence). This needs to be:
1. Dropped
2. Replaced with the gapless counter function (see Section 3)
3. The invoice generation code calls `next_invoice_number()` via RPC

### Calling from Application Code

```typescript
// Server action or API route
const { data: invoiceNumber } = await supabase
  .rpc('next_invoice_number', { p_organization_id: orgId });

// Insert invoice with the generated number
await supabase.from('invoices').insert({
  invoice_number: invoiceNumber,
  participant_id,
  // ...
} as any);
```

### Overflow Consideration

With NNN (3 digits), maximum is 999 invoices per year. For a single NDIS provider like Ephraim Care generating per-participant invoices, this is adequate. If needed, the padding can be increased to 4 digits in the format function.

## 7. CSV Export Format

### Generation Logic

```typescript
interface PaceCsvRow {
  RegistrationNumber: string;      // Provider reg number (starts with 405)
  NDISNumber: string;              // Participant NDIS number (starts with 43)
  SupportsDeliveredFrom: string;   // YYYY-MM-DD
  SupportsDeliveredTo: string;     // YYYY-MM-DD
  SupportNumber: string;           // NDIS item number
  ClaimReference: string;          // Invoice number (INV-YYYY-NNN)
  Quantity: string;                // Decimal hours
  Hours: string;                   // Always blank
  UnitPrice: string;               // Decimal rate
  GSTCode: string;                 // P1 or P2
  AuthorisedBy: string;            // Blank
  ParticipantApproved: string;     // Blank
  InKindFundingProgram: string;    // Blank
  ClaimType: string;               // Blank (direct service)
  CancellationReason: string;      // Blank
  'ABN of Support Provider': string; // 76685693565 (no spaces)
}
```

### CSV Generation Pattern

```typescript
function generatePaceCsv(invoices: InvoiceWithLineItems[]): string {
  const headers = [
    'RegistrationNumber', 'NDISNumber', 'SupportsDeliveredFrom',
    'SupportsDeliveredTo', 'SupportNumber', 'ClaimReference',
    'Quantity', 'Hours', 'UnitPrice', 'GSTCode',
    'AuthorisedBy', 'ParticipantApproved', 'InKindFundingProgram',
    'ClaimType', 'CancellationReason', 'ABN of Support Provider'
  ];

  const rows = invoices.flatMap(invoice =>
    invoice.line_items.map(item => [
      registrationNumber,
      invoice.participant_ndis_number,
      formatDate(item.service_date),  // YYYY-MM-DD
      formatDate(item.service_date),  // Same for single-day services
      item.ndis_item_number,
      invoice.invoice_number,
      (item.billable_minutes / 60).toFixed(2),
      '',                             // Hours always blank
      item.unit_price.toFixed(2),
      'P1',                           // GST applicable (per INVC-06)
      '', '', '', '', '',             // Legacy/blank fields
      '76685693565'                   // ABN no spaces
    ].join(','))
  );

  return [headers.join(','), ...rows].join('\n');
}
```

### Download Pattern

```typescript
// app/api/invoices/export-csv/route.ts
export async function POST(request: Request) {
  const { invoiceIds } = await request.json();

  // Fetch all selected invoices with line items
  const invoices = await fetchInvoicesWithLineItems(invoiceIds);

  const csv = generatePaceCsv(invoices);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="NDIS-Bulk-Payment-${formatDate(new Date())}.csv"`,
    },
  });
}
```

## 8. Recommended Libraries

### Core (Install for Phase 7)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-pdf/renderer` | ^4.3.2 | PDF generation | React component API, server-side support, React 19 compatible |
| `date-fns` | ^4.1.0 | Date calculations | Already in project, excellent for duration/day-type logic |

### Already Available (No Install Needed)

| Library | Purpose | Already In |
|---------|---------|-----------|
| `@tanstack/react-query` | Data fetching/mutations | admin package.json |
| `zod` | Schema validation | admin package.json |
| `react-hook-form` | Rate editing forms | admin package.json |
| `@hookform/resolvers` | Zod + form integration | admin package.json |
| `@date-fns/tz` | Timezone handling | admin package.json |
| `lucide-react` | Icons | admin package.json |

### Installation Command

```bash
pnpm --filter @ephraimcare/admin add @react-pdf/renderer
```

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| @react-pdf/renderer | Puppeteer | Too heavy, cold starts, memory issues on serverless |
| @react-pdf/renderer | pdfmake | JSON API less familiar than JSX to team, weaker typing |
| Custom CSV | papaparse | Overkill -- simple string concatenation sufficient for fixed-format CSV |
| Postgres sequence | Standard `nextval()` | Gaps in sequences are unacceptable for invoice numbering |

## 9. Key Implementation Risks

### Risk 1: Invoice Number Format Mismatch

**What goes wrong:** The existing database trigger generates `INV-YYYYMM-NNNN` format but the requirement specifies `INV-YYYY-NNN`.
**Why it happens:** The migration was created speculatively before requirements were finalized.
**How to avoid:** New migration must DROP the existing trigger and replace with the gapless counter approach.
**Warning signs:** Invoice numbers appearing in wrong format.

### Risk 2: GST Calculation Precision

**What goes wrong:** Floating-point arithmetic produces incorrect cents (e.g., $45.195 instead of $45.20).
**Why it happens:** JavaScript floating-point math.
**How to avoid:** Always round to 2 decimal places at the final calculation step. Use `Math.round(value * 100) / 100`. Store as `decimal(12,2)` in database.
**Warning signs:** Totals that don't add up when manually verified.

### Risk 3: Race Condition on Invoice Number

**What goes wrong:** Two admins generate invoices simultaneously, getting the same number.
**Why it happens:** Without row-level locking, concurrent reads can return same counter value.
**How to avoid:** The `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` pattern serializes access via row-level lock.
**Warning signs:** Unique constraint violations on `invoice_number`.

### Risk 4: Rate Snapshot Timing

**What goes wrong:** Admin changes rate, then edits a draft invoice -- which rate applies?
**Why it happens:** Ambiguity about when rates are captured.
**How to avoid:** Rates are snapshotted into `unit_price` at invoice generation time. Draft edits do NOT re-fetch rates. Only regenerating the invoice (delete + recreate) would use new rates.
**Warning signs:** Draft invoice totals changing unexpectedly.

### Risk 5: @react-pdf/renderer Server-Side Issues

**What goes wrong:** "Buffer is not defined" or crashes in production.
**Why it happens:** Next.js edge runtime lacks Node.js Buffer; bundler issues with ESM.
**How to avoid:**
  - Set `export const runtime = 'nodejs'` in route handler
  - Add `serverExternalPackages: ['@react-pdf/renderer']` to next.config.ts
  - Test PDF generation in production-like environment
**Warning signs:** Works in dev, fails in production build.

### Risk 6: Shift Without Check-In Data

**What goes wrong:** A shift has status 'completed' but no `shift_check_ins` record.
**Why it happens:** Edge case from admin override or data migration.
**How to avoid:** When generating invoices, join shifts with shift_check_ins. If check-in record is missing, fall back to scheduled duration as both scheduled and actual (effectively using scheduled only).
**Warning signs:** Null actual_start/actual_end with 'completed' status.

### Risk 7: Large Invoice PDF Memory

**What goes wrong:** Invoice with many line items causes memory pressure on server.
**Why it happens:** @react-pdf/renderer builds full document in memory before streaming.
**How to avoid:** For a single-participant invoice covering a date range, line items are bounded (max ~60 shifts in a month). This is not a practical concern for Ephraim Care's volume.
**Warning signs:** Only relevant if batch generation is added later.

## Architecture Patterns

### Recommended Project Structure

```
apps/admin/
├── app/
│   ├── (protected)/
│   │   ├── invoices/
│   │   │   ├── page.tsx              # Invoice list page
│   │   │   ├── generate/page.tsx     # Generate new invoice
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Invoice detail/preview
│   │   └── settings/
│   │       ├── page.tsx              # Existing settings
│   │       ├── rates/page.tsx        # Support type rates
│   │       └── holidays/page.tsx     # Public holidays
│   └── api/
│       └── invoices/
│           ├── generate/route.ts     # Generate invoice (POST)
│           ├── [id]/
│           │   ├── finalize/route.ts # Finalize invoice (POST)
│           │   └── pdf/route.ts      # Download PDF (GET)
│           └── export-csv/route.ts   # PACE CSV export (POST)
├── components/
│   ├── invoices/
│   │   ├── InvoiceList.tsx
│   │   ├── InvoicePreview.tsx
│   │   ├── GenerateInvoiceForm.tsx
│   │   └── LineItemsTable.tsx
│   └── pdf/
│       ├── InvoicePDF.tsx            # Main PDF document
│       ├── PDFHeader.tsx             # Logo + business details
│       ├── PDFLineItems.tsx          # Table rows
│       └── PDFFooter.tsx             # "Powered by OpBros"
├── lib/
│   └── invoices/
│       ├── calculations.ts           # Billing logic
│       ├── csv-export.ts             # PACE CSV generation
│       ├── schemas.ts                # Zod schemas
│       └── types.ts                  # Invoice-specific types
└── public/
    ├── fonts/
    │   ├── Inter-Regular.ttf
    │   ├── Inter-Medium.ttf
    │   └── Inter-Bold.ttf
    └── images/
        └── ephraim-care-logo.png
```

### Pattern: Server Action for Invoice Generation

Invoice generation involves multiple database operations (fetch shifts, calculate totals, insert invoice + line items). Use a Next.js API route (not a server action) because:
- Multiple Supabase calls in a transaction-like pattern
- Needs to call the `next_invoice_number` RPC
- Returns structured data for the preview

### Pattern: Optimistic UI for Finalization

When admin clicks "Finalize":
1. Show confirmation dialog
2. On confirm, call API route
3. Optimistically update TanStack Query cache to show locked state
4. On error, revert

### Anti-Patterns to Avoid

- **Calculating totals client-side only:** Always calculate server-side and store in DB. Client display reads stored values.
- **Using JavaScript `number` for currency:** Always use `decimal(12,2)` in DB and round at calculation boundaries.
- **Regenerating invoice numbers:** Once assigned, an invoice number must never change -- even if the invoice is deleted.
- **Fetching all shifts without date filter:** Always scope queries to the invoice period.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF layout engine | Custom HTML-to-PDF | @react-pdf/renderer | Handles pagination, page breaks, font embedding |
| Date calculations | Manual timestamp math | date-fns (differenceInMinutes, isSaturday, etc.) | Timezone-safe, DST-aware |
| CSV escaping | String concatenation | Simple join (our data has no commas/quotes) | Fixed format with known-clean data; no user-generated text in CSV fields |
| Gapless sequences | MAX()+1 queries | Counter table with row-lock | Race condition proof |
| Currency formatting | toFixed(2) everywhere | Consistent helper function | Centralize rounding logic |

## Code Examples

### Invoice Generation API Route

```typescript
// app/api/invoices/generate/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateBillableMinutes, getDayType, calculateLineTotal } from '@/lib/invoices/calculations';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { participant_id, period_start, period_end } = await request.json();

  // 1. Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  // ... role check ...

  // 2. Fetch completed shifts with check-ins in date range
  const { data: shifts } = await (supabase
    .from('shifts') as any)
    .select(`
      id, scheduled_start, scheduled_end, support_type,
      shift_check_ins(check_in_time, check_out_time, duration_minutes)
    `)
    .eq('participant_id', participant_id)
    .eq('status', 'completed')
    .gte('scheduled_start', period_start)
    .lte('scheduled_start', period_end)
    .order('scheduled_start', { ascending: true });

  if (!shifts?.length) {
    return NextResponse.json(
      { error: 'No billable shifts found in date range' },
      { status: 400 }
    );
  }

  // 3. Fetch rates and holidays
  const { data: rates } = await (supabase
    .from('support_type_rates') as any)
    .select('*')
    .eq('is_active', true);

  const { data: holidays } = await (supabase
    .from('public_holidays') as any)
    .select('holiday_date')
    .gte('holiday_date', period_start)
    .lte('holiday_date', period_end);

  // 4. Generate invoice number
  const { data: invoiceNumber } = await supabase
    .rpc('next_invoice_number', { p_organization_id: orgId });

  // 5. Calculate line items
  const lineItems = shifts.map(shift => {
    const checkIn = shift.shift_check_ins?.[0];
    const scheduledStart = new Date(shift.scheduled_start);
    const scheduledEnd = new Date(shift.scheduled_end);
    const actualStart = checkIn ? new Date(checkIn.check_in_time) : scheduledStart;
    const actualEnd = checkIn ? new Date(checkIn.check_out_time) : scheduledEnd;

    const billableMinutes = calculateBillableMinutes(
      scheduledStart, scheduledEnd, actualStart, actualEnd
    );
    const dayType = getDayType(scheduledStart, holidays);
    const rate = getRate(rates.find(r => r.support_type === shift.support_type), dayType);
    const lineTotal = calculateLineTotal(billableMinutes, rate);

    return {
      shift_id: shift.id,
      support_type: shift.support_type,
      day_type: dayType,
      ndis_item_number: getNdisItemNumber(shift.support_type, dayType, rates),
      description: `${shift.support_type} - ${dayType}`,
      service_date: format(scheduledStart, 'yyyy-MM-dd'),
      scheduled_minutes: differenceInMinutes(scheduledEnd, scheduledStart),
      actual_minutes: differenceInMinutes(actualEnd, actualStart),
      billable_minutes: billableMinutes,
      quantity: billableMinutes / 60,
      unit_price: rate,
      line_total: lineTotal,
    };
  });

  // 6. Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  const gst = Math.round(subtotal * 0.10 * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  // 7. Insert invoice + line items
  const { data: invoice, error } = await (supabase
    .from('invoices') as any)
    .insert({
      invoice_number: invoiceNumber,
      participant_id,
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      period_start,
      period_end,
      subtotal,
      gst,
      total,
      status: 'draft',
      organization_id: orgId,
      created_by: user.id,
    })
    .select()
    .single();

  // Insert line items
  await (supabase.from('invoice_line_items') as any)
    .insert(lineItems.map(item => ({
      invoice_id: invoice.id,
      ...item,
    })));

  return NextResponse.json({ invoice, lineItems });
}
```

### Finalize Invoice

```typescript
// app/api/invoices/[id]/finalize/route.ts
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify admin + fetch invoice
  const { data: invoice } = await (supabase
    .from('invoices') as any)
    .select('status')
    .eq('id', id)
    .single();

  if (invoice?.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft invoices can be finalized' },
      { status: 400 }
    );
  }

  const { error } = await (supabase
    .from('invoices') as any)
    .update({
      status: 'submitted',
      finalized_at: new Date().toISOString(),
      finalized_by: user.id,
    })
    .eq('id', id);

  return NextResponse.json({ success: true });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer for PDF | @react-pdf/renderer | 2024+ | No browser dependency, smaller bundle |
| INV-YYYYMM-NNNN | INV-YYYY-NNN | Phase 7 decision | Simpler format per requirements |
| Standard Postgres sequences | Gapless counter table | Always for invoicing | Legally required sequential numbering |
| Per-participant numbering | Global sequential | Phase 7 decision | Single counter per org per year |

## Open Questions

1. **Provider Registration Number**
   - What we know: NDIS registration numbers start with '405', needed for PACE CSV
   - What's unclear: What is Ephraim Care's specific registration number?
   - Recommendation: Add a field in settings or organization table; require admin to configure before CSV export

2. **NDIS Item Number Mapping**
   - What we know: Each support type needs an NDIS item number (e.g., 01_011_0107_1_1)
   - What's unclear: Which specific NDIS item numbers does Ephraim Care use for their support types?
   - Recommendation: The `ndis_item_number` field in `support_type_rates` table allows admin to configure this per support type

3. **Logo File Format**
   - What we know: @react-pdf/renderer supports PNG and JPEG images
   - What's unclear: Does the Ephraim Care logo exist in the project, and in what format?
   - Recommendation: Store as PNG in `public/images/ephraim-care-logo.png`; add to project assets

4. **Invoice Status Enum Adjustment**
   - What we know: Current enum is `draft, pending, submitted, paid, overdue, cancelled`
   - What's unclear: The requirement uses `draft` -> `final` but existing enum has `submitted`
   - Recommendation: Use `submitted` as the "finalized" status (maps to "locked/final"). No enum change needed.

## Sources

### Primary (HIGH confidence)
- NDIS Official: Bulk Payment CSV format (ndis.gov.au/providers/working-provider/getting-paid/bulk-payments)
- NDIS Official: Invoicing requirements (ndis.gov.au/providers/working-provider/getting-paid/invoicing-and-record-keeping)
- ATO: GST and NDIS (ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/in-detail/your-industry/gst-and-health/national-disability-insurance-scheme)
- @react-pdf/renderer official docs (react-pdf.org/fonts, react-pdf.org/compatibility)
- @react-pdf/renderer npm (npmjs.com/package/@react-pdf/renderer) - v4.3.2 current
- Existing codebase: migrations, RLS policies, API route patterns

### Secondary (MEDIUM confidence)
- CaseManager.biz: NDIS integration CSV field specs (learning.casemanager.biz/web/IntegrationJournalEntry/NDIS.htm)
- CYBERTEC: PostgreSQL sequences vs invoice numbers (cybertec-postgresql.com)
- GitHub: Gapless counter pattern (github.com/kimmobrunfeldt/howto-everything)
- NDIS Price Guide 2024-25 (lifebridge.org.au, sacal.org.au)
- MDHomeCare: NDIS codes 2025-26 (mdhomecare.com.au)

### Tertiary (LOW confidence)
- Medium articles on Next.js PDF generation patterns
- DEV Community: pdfmake examples
- Stack Overflow: Supabase sequence discussions

## Metadata

**Confidence breakdown:**
- NDIS/PACE format: HIGH - verified with official NDIS sources and third-party implementations
- PDF generation: HIGH - @react-pdf/renderer docs verified, React 19 + Next.js 15 compatibility confirmed
- Database schema: HIGH - based on existing codebase patterns and PostgreSQL best practices
- Billing logic: HIGH - straightforward arithmetic with clear requirements
- Rate model: HIGH - requirements clearly defined in CONTEXT.md
- Invoice numbering: HIGH - gapless counter is well-established pattern with PostgreSQL

**Research date:** 2026-01-25
**Valid until:** 2026-03-25 (stable domain, NDIS pricing changes annually in July)
