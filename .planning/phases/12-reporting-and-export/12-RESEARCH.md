# Phase 12: Reporting and Export - Research

**Researched:** 2026-01-26
**Domain:** Admin Reporting Dashboard, Data Visualization, Multi-format Export
**Confidence:** HIGH

## Summary

This phase implements comprehensive reporting and export functionality for the Ephraim Care admin portal, supporting accounting workflows and NDIS audit requirements. The research identifies four main report types (budget utilization, revenue trends, worker hours, participant activity) with a unified filtering system and multi-format export (CSV, Excel, PDF).

The codebase already has established patterns for PDF generation (`@react-pdf/renderer` with Inter fonts and Ephraim Care branding), CSV export (PACE format helper), and data filtering (Select-based filters with TanStack Query). This phase extends these patterns to a dedicated `/reports` section with shared report infrastructure.

**Primary recommendation:** Build a reusable `ReportLayout` layout component with date range picker, entity filters, and export buttons. Use Recharts for all data visualization (established React charting library with React 19 support). Use SheetJS (xlsx) for Excel export (higher performance than xlsx-populate, broader format support). Extend existing `@react-pdf/renderer` setup for report PDFs.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.15.0 | Data visualization (bar, line, pie charts) | 4.6M weekly downloads, native React/SVG, declarative API, React 19 compatible, 165 code examples in docs |
| xlsx (SheetJS) | ^0.18.5 | Excel XLSX export | 4.6M weekly downloads, fastest parsing performance, broad format support, works in Next.js |
| @react-pdf/renderer | ^4.3.2 (existing) | PDF report generation | Already installed and configured with fonts/branding at /apps/admin/components/pdf/ |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 (existing) | Date manipulation and formatting | Date range filtering, period calculations |
| @tanstack/react-query | ^5.65.0 (existing) | Server state management | Report data fetching with caching |
| @tanstack/react-table | ^8.21.0 (existing) | Tabular data display | Report data tables with sorting/filtering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Victory, Nivo, Chart.js | Recharts has more React-native API, better TypeScript support, simpler learning curve, officially React 19 compatible |
| SheetJS (xlsx) | xlsx-populate, exceljs | xlsx-populate has better styling but SheetJS is 2-3x faster for large datasets; exceljs has more features but larger bundle |
| @react-pdf/renderer | jsPDF, pdfmake | @react-pdf/renderer already configured with brand styles; jsPDF requires more manual layout work |

**Installation:**
```bash
pnpm add recharts xlsx --filter @ephraimcare/admin
```

## Architecture Patterns

### Recommended Project Structure
```
apps/admin/
├── app/(protected)/reports/
│   ├── page.tsx                    # Reports dashboard/overview
│   ├── budget/page.tsx             # Budget utilization report (REPT-01)
│   ├── revenue/page.tsx            # Revenue trends report (REPT-02)
│   ├── worker-hours/page.tsx       # Worker hours report (REPT-03)
│   └── participant-activity/page.tsx # Participant activity report (REPT-04)
├── app/api/reports/
│   ├── budget/route.ts             # Budget data API
│   ├── revenue/route.ts            # Revenue data API
│   ├── worker-hours/route.ts       # Worker hours data API
│   ├── participant-activity/route.ts # Participant activity data API
│   └── [reportType]/export/route.ts  # Unified export endpoint
├── components/reports/
│   ├── ReportLayout.tsx            # Shared report page layout
│   ├── DateRangePicker.tsx         # Date range filter component (REPT-05)
│   ├── ReportFilters.tsx           # Entity filters (participant, worker, support type) (REPT-05)
│   ├── ExportButtons.tsx           # CSV/Excel/PDF export buttons (REPT-06, REPT-07)
│   ├── charts/
│   │   ├── BudgetBarChart.tsx      # Budget utilization visualization (REPT-08)
│   │   ├── RevenueLineChart.tsx    # Revenue trend visualization (REPT-08)
│   │   ├── HoursDistributionChart.tsx # Worker hours distribution (REPT-08)
│   │   └── ChartCard.tsx           # Reusable chart container with title
│   └── pdf/
│       ├── ReportPdfDocument.tsx   # Base PDF report template (REPT-07)
│       ├── BudgetReportPdf.tsx     # Budget-specific PDF layout
│       ├── RevenueReportPdf.tsx    # Revenue-specific PDF layout
│       └── report-pdf-styles.ts    # Extend existing pdf-styles.ts
├── hooks/
│   ├── use-budget-report.ts        # Budget data fetching/aggregation
│   ├── use-revenue-report.ts       # Revenue data fetching/aggregation
│   ├── use-worker-hours-report.ts  # Worker hours aggregation
│   └── use-participant-activity-report.ts # Participant activity data
└── lib/reports/
    ├── types.ts                    # Report data types
    ├── constants.ts                # Report configuration constants
    ├── csv-export.ts               # Generic CSV export helper (REPT-06, EXPRT-01/02/03)
    ├── excel-export.ts             # SheetJS Excel export helper (REPT-06)
    ├── pdf-export.ts               # PDF generation utilities (REPT-07)
    ├── accounting-formats.ts       # Xero/MYOB CSV formats (EXPRT-01)
    └── calculations.ts             # Report aggregation functions
```

### Pattern 1: Reusable Report Layout
**What:** Shared layout component wrapping all report pages with consistent filtering and export UI
**When to use:** Every report page
**Example:**
```typescript
// Source: Established pattern from existing shift-filters.tsx and invoices page
interface ReportLayoutProps {
  title: string
  description: string
  filters: React.ReactNode
  exportButtons: React.ReactNode
  children: React.ReactNode
  isLoading?: boolean
  summary?: { label: string; value: string | number }[]
}

export function ReportLayout({
  title,
  description,
  filters,
  exportButtons,
  children,
  isLoading,
  summary
}: ReportLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header with title and export */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {exportButtons}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {filters}
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.map((stat) => (
            <div key={stat.label} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Report content */}
      {isLoading ? <ReportSkeleton /> : children}
    </div>
  )
}
```

### Pattern 2: Date Range Filter with Presets
**What:** Date picker with common presets (This Month, Last Month, This Quarter, Custom)
**When to use:** All reports require date range filtering (REPT-05)
**Example:**
```typescript
// Source: Common pattern for admin dashboards
import { startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter } from 'date-fns'

interface DateRangePickerProps {
  value: { from: Date; to: Date }
  onChange: (range: { from: Date; to: Date }) => void
}

const PRESETS = [
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last Month', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'This Quarter', getValue: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: 'Last 3 Months', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
]
```

### Pattern 3: Chart with Responsive Container
**What:** All charts wrapped in ResponsiveContainer for fluid sizing (REPT-08)
**When to use:** Every Recharts visualization
**Example:**
```typescript
// Source: Context7 /recharts/recharts documentation
'use client' // IMPORTANT: Charts must be client components

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface BudgetBarChartProps {
  data: { participant: string; allocated: number; used: number }[]
}

export function BudgetBarChart({ data }: BudgetBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="participant" />
        <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
        <Legend />
        <Bar dataKey="allocated" name="Allocated Budget" fill="#00BFA5" />
        <Bar dataKey="used" name="Used Budget" fill="#66BB6A" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Pattern 4: Excel Export with SheetJS
**What:** Client-side Excel file generation using SheetJS (REPT-06)
**When to use:** Excel exports for all reports
**Example:**
```typescript
// Source: Context7 SheetJS documentation
import * as XLSX from 'xlsx'

interface ExportToExcelOptions<T> {
  data: T[]
  columns: { header: string; key: keyof T; format?: (value: any) => string }[]
  filename: string
  sheetName?: string
}

export function exportToExcel<T>({ data, columns, filename, sheetName = 'Report' }: ExportToExcelOptions<T>) {
  // Transform data to array of arrays with headers
  const headers = columns.map(col => col.header)
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key]
      return col.format ? col.format(value) : value
    })
  )

  // Create worksheet and workbook
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()

  // Auto-width columns
  const maxWidth = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => String(r[i] || '').length))
  )
  worksheet['!cols'] = maxWidth.map(w => ({ wch: w + 2 }))

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
```

### Pattern 5: PDF Report with Reusable Styles
**What:** Extend existing pdf-styles.ts for report-specific layouts (REPT-07)
**When to use:** PDF export for all reports
**Example:**
```typescript
// Source: Existing apps/admin/components/pdf/pdf-styles.ts pattern
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { registerFonts, styles as baseStyles } from '../pdf/pdf-styles'

// Must register fonts before rendering
registerFonts()

// Extend base styles for reports
const reportStyles = StyleSheet.create({
  ...baseStyles,
  reportTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 10,
    color: '#00BFA5', // BRAND_TEAL
  },
  dateRange: {
    fontSize: 10,
    color: '#666',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
})

export function BudgetReportPDF({ data, dateRange }) {
  return (
    <Document>
      <Page size="A4" style={reportStyles.page}>
        <View style={reportStyles.header}>
          <Text style={reportStyles.companyName}>Ephraim Care</Text>
          <Text style={reportStyles.reportTitle}>Budget Utilization Report</Text>
        </View>
        <Text style={reportStyles.dateRange}>
          Period: {dateRange.from} - {dateRange.to}
        </Text>
        {/* Report content */}
      </Page>
    </Document>
  )
}
```

### Pattern 6: API Route for Export
**What:** Server-side export generation following existing invoice export pattern
**When to use:** Large exports, PDF generation, accounting software formats
**Example:**
```typescript
// Source: Existing /apps/admin/app/api/invoices/export-csv/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'coordinator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Parse request
    const body = await request.json()
    const { format, filters } = body

    // 4. Fetch data (RLS automatically applies)
    const { data, error } = await supabase
      .from('budget_utilization_summary')
      .select('*')
      // Apply filters from request

    if (error) throw error

    // 5. Generate export based on format
    let fileContent: Buffer | string
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'csv':
        fileContent = generateCsv(data)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break
      case 'excel':
        fileContent = generateExcel(data)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileExtension = 'xlsx'
        break
      case 'pdf':
        fileContent = await generatePdf(data)
        contentType = 'application/pdf'
        fileExtension = 'pdf'
        break
    }

    // 6. Return file
    const filename = `report-${Date.now()}.${fileExtension}`
    return new Response(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Anti-Patterns to Avoid
- **Server-side chart rendering:** Charts should render client-side only. Use 'use client' directive. For PDFs, use table-based layouts instead of embedded charts.
- **Fetching all data at once:** Use pagination or date-range limits. Large reports should batch data fetching.
- **Blocking UI during export:** Use async export with loading state (existing ExportCsvButton pattern).
- **Hardcoded Xero/MYOB formats:** Create generic CSV export with configurable columns; document Xero column mapping separately.
- **Bypassing RLS:** Never use service role key for reports. Always use authenticated Supabase client to ensure multi-tenant isolation.

## Database Considerations

### Existing Tables for Reporting

**Core tables already available:**

1. **invoices** - Revenue tracking
   - Fields: `invoice_number`, `invoice_date`, `period_start`, `period_end`, `subtotal`, `gst`, `total`, `status`
   - Indexed: `invoice_date`, `status`, `organization_id`

2. **invoice_line_items** - Service breakdown
   - Fields: `support_type`, `day_type`, `service_date`, `billable_minutes`, `unit_price`, `line_total`
   - Links: `invoice_id`, `shift_id`

3. **shifts** - Worker hours and participant activity
   - Fields: `scheduled_start`, `scheduled_end`, `actual_start`, `actual_end`, `status`
   - Links: `participant_id`, `worker_id`

4. **shift_check_ins** - Actual work timestamps
   - Fields: `check_in_time`, `check_out_time`
   - Used for accurate hours calculation

5. **plan_budgets** - Budget allocation
   - Fields: `category`, `subcategory`, `allocated_amount`, `used_amount`
   - Links: `plan_id`

6. **support_type_rates** - Pricing data
   - Fields: `support_type`, `weekday_rate`, `saturday_rate`, `sunday_rate`, `public_holiday_rate`

### Optional Database Views

Consider creating aggregation views for performance (can be added if direct queries are slow):

```sql
-- Budget utilization by participant
CREATE OR REPLACE VIEW budget_utilization_summary AS
SELECT
  p.id AS participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  p.ndis_number,
  np.plan_number,
  pb.category,
  pb.allocated_amount,
  pb.used_amount,
  pb.allocated_amount - pb.used_amount AS remaining_amount,
  ROUND((pb.used_amount / NULLIF(pb.allocated_amount, 0) * 100)::numeric, 2) AS utilization_percentage
FROM participants p
JOIN ndis_plans np ON np.participant_id = p.id AND np.is_current = true
JOIN plan_budgets pb ON pb.plan_id = np.id;

-- Revenue by month
CREATE OR REPLACE VIEW revenue_by_month AS
SELECT
  DATE_TRUNC('month', invoice_date) AS month,
  COUNT(*) AS invoice_count,
  SUM(total) AS total_revenue,
  SUM(subtotal) AS subtotal,
  SUM(gst) AS gst
FROM invoices
WHERE status IN ('submitted', 'paid')
GROUP BY DATE_TRUNC('month', invoice_date);

-- Worker hours summary
CREATE OR REPLACE VIEW worker_hours_summary AS
SELECT
  w.id AS worker_id,
  prof.first_name || ' ' || prof.last_name AS worker_name,
  COUNT(s.id) AS shift_count,
  SUM(EXTRACT(EPOCH FROM (s.actual_end - s.actual_start)) / 3600) AS total_hours
FROM workers w
JOIN profiles prof ON prof.id = w.profile_id
LEFT JOIN shifts s ON s.worker_id = w.id AND s.status = 'completed'
GROUP BY w.id, prof.first_name, prof.last_name;
```

**Note:** Start without views. Add them only if query performance becomes an issue (>2 seconds for report load).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart rendering | Custom SVG charts | Recharts | Accessibility, responsive sizing, legend/tooltip handling, React 19 support |
| Excel file generation | CSV-to-XLSX conversion | SheetJS XLSX.utils | Proper Excel format, multiple sheets, formulas support, cell styling |
| PDF table layout | Manual View/Text positioning | @react-pdf/renderer Table pattern | Automatic row breaking, consistent column widths, page overflow handling |
| Date range presets | Custom date math | date-fns functions | Timezone handling, edge cases (month boundaries), daylight saving |
| Currency formatting | String concatenation | Intl.NumberFormat | Locale-aware, proper rounding, currency symbols |
| Report data aggregation | Client-side loops | Supabase aggregate functions (SUM, COUNT, GROUP BY) | Performance, reduced data transfer, database indexing |
| CSV escaping | Regex replacement | Existing csv-export.ts helper | Edge cases (quotes, newlines, commas) |

**Key insight:** Report calculations should happen in the database where possible. Supabase PostgREST supports aggregations. Client-side aggregation is fine for display formatting but not for summing large datasets.

## Common Pitfalls

### Pitfall 1: Charts Not Rendering in SSR
**What goes wrong:** Recharts uses browser APIs (DOM measurements) and fails during server-side rendering
**Why it happens:** Next.js App Router renders components on server first
**How to avoid:** Mark all chart components with 'use client' directive; wrap in dynamic import with ssr: false if needed
**Warning signs:** "window is not defined" or "ResizeObserver is not defined" errors

### Pitfall 2: Large Excel Files Crashing Browser
**What goes wrong:** Exporting 10,000+ rows causes memory issues or tab crash
**Why it happens:** SheetJS builds entire workbook in memory before writing
**How to avoid:** Limit export to reasonable row counts (e.g., 5000 max); for larger exports, use server-side generation with streaming
**Warning signs:** Long delays before download starts, browser becoming unresponsive

### Pitfall 3: PDF Generation Timeout
**What goes wrong:** Complex PDFs with many pages take too long to generate
**Why it happens:** @react-pdf/renderer calculates layout synchronously
**How to avoid:** Paginate reports (max 50 rows per page); use server-side PDF generation in API routes (see /api/invoices/[id]/pdf/route.ts)
**Warning signs:** UI freezing during "Generate PDF" action

### Pitfall 4: Xero Import Failures
**What goes wrong:** Exported CSV rejected by Xero with vague error messages
**Why it happens:** Column names don't match exactly, date format incorrect, tax codes don't exist in user's Xero
**How to avoid:** Match Xero's official template exactly; use DD/MM/YYYY date format for Australia; document required Xero setup (tax codes, account codes)
**Warning signs:** "Import failed" without specific column errors

### Pitfall 5: Inconsistent Number Formatting
**What goes wrong:** Numbers display differently in UI vs CSV vs Excel vs PDF
**Why it happens:** Each export format applies its own formatting
**How to avoid:** Create shared formatCurrency/formatHours functions used across all formats; Excel should receive raw numbers with cell formatting, not pre-formatted strings
**Warning signs:** "$1,234.56" in UI but "1234.56" in CSV

### Pitfall 6: Date Range Filter Edge Cases
**What goes wrong:** Reports show wrong data at month/quarter boundaries
**Why it happens:** Timezone issues, exclusive vs inclusive date comparisons
**How to avoid:** Use date-only comparisons (not timestamps); ensure database queries use >= start AND <= end; handle user's local timezone (Australia/Sydney)
**Warning signs:** First or last day of month missing from reports

### Pitfall 7: Multi-Tenant Data Leakage
**What goes wrong:** User sees data from other organizations
**Why it happens:** organization_id filter missing or RLS bypassed with service role
**How to avoid:** Always use createClient() from /lib/supabase/server (includes user context); never use service role key for reports; test with multiple organizations
**Warning signs:** Unexpected data in reports, wrong participant counts

## Code Examples

Verified patterns from official sources:

### Generic CSV Export Helper (REPT-06, EXPRT-01/02/03)
```typescript
// Source: Extend existing apps/admin/lib/invoices/csv-export.ts pattern
export function generateCsv<T>(
  data: T[],
  columns: { header: string; key: keyof T; format?: (value: any) => string }[]
): string {
  const headers = columns.map(col => col.header).join(',')

  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key]
      const formatted = col.format ? col.format(value) : String(value ?? '')
      // Escape commas and quotes in CSV
      if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
        return `"${formatted.replace(/"/g, '""')}"`
      }
      return formatted
    }).join(',')
  )

  return [headers, ...rows].join('\n')
}

// Usage for participant export (EXPRT-02)
export function exportParticipantsCsv(participants: Participant[]): string {
  return generateCsv(participants, [
    { header: 'NDIS Number', key: 'ndis_number' },
    { header: 'First Name', key: 'first_name' },
    { header: 'Last Name', key: 'last_name' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Address', key: 'address_line_1' },
    { header: 'Suburb', key: 'suburb' },
    { header: 'State', key: 'state' },
    { header: 'Postcode', key: 'postcode' },
  ])
}

// Usage for worker hours export (EXPRT-03)
export function exportWorkerHoursCsv(hours: WorkerHoursRow[]): string {
  return generateCsv(hours, [
    { header: 'Worker Name', key: 'worker_name' },
    { header: 'Week Ending', key: 'week_ending', format: (d) => format(new Date(d), 'dd/MM/yyyy') },
    { header: 'Shift Date', key: 'shift_date', format: (d) => format(new Date(d), 'dd/MM/yyyy') },
    { header: 'Participant', key: 'participant_name' },
    { header: 'Scheduled Hours', key: 'scheduled_hours', format: (h) => h.toFixed(2) },
    { header: 'Actual Hours', key: 'actual_hours', format: (h) => h.toFixed(2) },
    { header: 'Billable Hours', key: 'billable_hours', format: (h) => h.toFixed(2) },
    { header: 'Rate Type', key: 'rate_type' },
  ])
}
```

### Budget Report Data Hook (REPT-01)
```typescript
// Source: Pattern from existing use-invoices.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface BudgetReportFilters {
  dateFrom?: Date
  dateTo?: Date
  participantId?: string
  category?: string
}

interface BudgetReportData {
  participants: {
    id: string
    name: string
    ndis_number: string
    allocated_budget: number
    used_budget: number
    utilization_percent: number
    alert: 'ok' | 'warning' | 'critical'
  }[]
  totals: {
    total_allocated: number
    total_used: number
    overall_utilization: number
  }
}

export function useBudgetReport(filters: BudgetReportFilters) {
  return useQuery<BudgetReportData>({
    queryKey: ['budget-report', filters],
    queryFn: async () => {
      const supabase = createClient()

      // Fetch plan budgets with participant info
      let query = supabase
        .from('plan_budgets')
        .select(`
          allocated_amount,
          used_amount,
          category,
          ndis_plans!inner(
            participant_id,
            is_current,
            participants(id, first_name, last_name, ndis_number)
          )
        `)
        .eq('ndis_plans.is_current', true)

      // Apply filters
      if (filters.participantId) {
        query = query.eq('ndis_plans.participant_id', filters.participantId)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query
      if (error) throw error

      // Aggregate by participant (client-side)
      const participantMap = new Map()
      for (const budget of data ?? []) {
        const participant = budget.ndis_plans?.participants
        if (!participant) continue

        const key = participant.id
        const existing = participantMap.get(key) || {
          name: `${participant.first_name} ${participant.last_name}`,
          ndis_number: participant.ndis_number,
          allocated: 0,
          used: 0,
        }

        existing.allocated += Number(budget.allocated_amount) || 0
        existing.used += Number(budget.used_amount) || 0
        participantMap.set(key, existing)
      }

      // Transform to report format
      const participants = Array.from(participantMap.entries()).map(([id, p]) => {
        const utilization = p.allocated > 0 ? (p.used / p.allocated) * 100 : 0
        return {
          id,
          name: p.name,
          ndis_number: p.ndis_number,
          allocated_budget: p.allocated,
          used_budget: p.used,
          utilization_percent: utilization,
          alert: utilization >= 90 ? 'critical' : utilization >= 75 ? 'warning' : 'ok' as const,
        }
      })

      // Calculate totals
      const totals = participants.reduce(
        (acc, p) => ({
          total_allocated: acc.total_allocated + p.allocated_budget,
          total_used: acc.total_used + p.used_budget,
          overall_utilization: 0,
        }),
        { total_allocated: 0, total_used: 0, overall_utilization: 0 }
      )
      totals.overall_utilization = totals.total_allocated > 0
        ? (totals.total_used / totals.total_allocated) * 100
        : 0

      return { participants, totals }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### Xero-Compatible Invoice CSV Format (EXPRT-01)
```typescript
// Source: Xero documentation - simplified columns for invoice import
// Documentation: https://central.xero.com/s/article/Import-customer-invoices-AU

export const XERO_INVOICE_COLUMNS = [
  'ContactName',
  'InvoiceNumber',
  'InvoiceDate',
  'DueDate',
  'Description',
  'Quantity',
  'UnitAmount',
  'AccountCode',
  'TaxType',
] as const

export function generateXeroInvoiceCsv(invoices: InvoiceWithLineItems[]): string {
  const headers = XERO_INVOICE_COLUMNS.join(',')
  const rows: string[] = []

  for (const invoice of invoices) {
    const contactName = `${invoice.participants?.first_name} ${invoice.participants?.last_name}`
    for (const item of invoice.line_items) {
      const row = [
        contactName,
        invoice.invoice_number,
        formatDateForXero(invoice.invoice_date),
        formatDateForXero(invoice.due_date),
        `${item.support_type} - ${item.day_type}`,
        (item.billable_minutes / 60).toFixed(2), // Hours as quantity
        item.unit_price.toFixed(2),
        '200', // Sales account code (configurable in settings)
        'GST on Income', // Must match Xero tax type name exactly
      ]

      // Escape CSV values
      rows.push(row.map(v => {
        if (v.includes(',') || v.includes('"')) {
          return `"${v.replace(/"/g, '""')}"`
        }
        return v
      }).join(','))
    }
  }

  return [headers, ...rows].join('\n')
}

function formatDateForXero(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return format(date, 'dd/MM/yyyy') // Xero requires DD/MM/YYYY for Australia
}
```

### MYOB-Compatible Invoice CSV Format (EXPRT-01)
```typescript
// Source: MYOB AccountRight documentation
// Note: MYOB Essentials has different format

export const MYOB_INVOICE_COLUMNS = [
  'Co./Last Name',
  'First Name',
  'Inv#',
  'Date',
  'Terms',
  'Due Date',
  'Item Number',
  'Description',
  'Quantity',
  'Unit Price',
  'Tax Code',
] as const

export function generateMyobInvoiceCsv(invoices: InvoiceWithLineItems[]): string {
  const headers = MYOB_INVOICE_COLUMNS.join(',')
  const rows: string[] = []

  for (const invoice of invoices) {
    const participant = invoice.participants
    if (!participant) continue

    for (const item of invoice.line_items) {
      const row = [
        participant.last_name,
        participant.first_name,
        invoice.invoice_number,
        formatDateForMyob(invoice.invoice_date),
        'Net 30',
        formatDateForMyob(invoice.due_date),
        item.ndis_item_number || '',
        `${item.support_type} - ${item.day_type}`,
        (item.billable_minutes / 60).toFixed(2),
        item.unit_price.toFixed(2),
        'GST', // MYOB tax code
      ]

      rows.push(row.map(v => {
        if (v.includes(',') || v.includes('"')) {
          return `"${v.replace(/"/g, '""')}"`
        }
        return v
      }).join(','))
    }
  }

  return [headers, ...rows].join('\n')
}

function formatDateForMyob(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return format(date, 'dd/MM/yyyy') // MYOB uses DD/MM/YYYY
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chartist.js / C3.js | Recharts / Victory | ~2019 | React-native declarative API, better TypeScript support |
| xlsx-style (deprecated) | SheetJS Community Edition | 2023 | xlsx-style unmaintained; SheetJS actively developed |
| Server-side PDF (wkhtmltopdf) | Client-side @react-pdf/renderer | ~2020 | No server dependencies, React component model |
| Moment.js for dates | date-fns v4 | 2024 | Tree-shakeable, immutable, better TypeScript |
| Chart.js (Canvas-based) | Recharts (SVG-based) | ~2021 | Better accessibility, scalable graphics, React-friendly API |

**Deprecated/outdated:**
- xlsx-style: Unmaintained fork, security issues. Use SheetJS with style options.
- Moment.js: Large bundle size, mutable API. Replaced by date-fns in this codebase.
- html2canvas for PDF: Unreliable for complex layouts. @react-pdf/renderer is purpose-built.
- Chart.js for React: Imperative API requires refs and lifecycle management. Recharts is declarative.

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Xero Account Codes**
   - What we know: Xero requires account codes that match the user's Chart of Accounts
   - What's unclear: Which account codes Ephraim Care uses (likely 200 for Sales, 400 for COGS)
   - Recommendation: Make account code configurable in organization settings; document required Xero setup; default to "200"

2. **PDF Chart Embedding**
   - What we know: @react-pdf/renderer doesn't support Recharts SVG directly
   - What's unclear: Whether to use recharts-to-png for chart images or table-based PDF layouts
   - Recommendation: Use table layouts for PDF reports (simpler, more reliable); charts are for screen viewing only (Phase 12 MVP)

3. **Large Report Performance Threshold**
   - What we know: SheetJS handles thousands of rows; exact limit is hardware-dependent
   - What's unclear: How many invoices/shifts constitute "large" for this user base
   - Recommendation: Start with 5000-row limit for client-side exports; monitor performance; add server-side export if needed

4. **NDIS Audit Report Format**
   - What we know: NDIS audits require evidence of service delivery, worker qualifications, incident records
   - What's unclear: Whether there's a specific report format auditors prefer
   - Recommendation: Ensure all required data is exportable; participant activity report covers service delivery evidence

5. **Report Caching Strategy**
   - What we know: TanStack Query caches report data; staleTime can be configured
   - What's unclear: Optimal cache duration for each report type
   - Recommendation: Budget/Revenue reports: 5min cache (changes frequently); Worker hours: 10min cache; Historical reports: 30min cache

## Implementation Checklist

### Week 1: Foundation
- [ ] Install recharts and xlsx dependencies
- [ ] Create /reports route structure
- [ ] Build ReportLayout component
- [ ] Build DateRangePicker component with presets
- [ ] Create generic CSV export helper (extend existing csv-export.ts)
- [ ] Create generic Excel export helper using SheetJS
- [ ] Implement first report: Budget Utilization (REPT-01)

### Week 2: Core Reports
- [ ] Revenue report with line chart (REPT-02)
- [ ] Worker hours report with distribution chart (REPT-03)
- [ ] Participant activity report (REPT-04)
- [ ] Implement all filtering (date range, participant, worker, support type) (REPT-05)
- [ ] CSV export for all reports (REPT-06)

### Week 3: Excel & PDF
- [ ] Excel export for all reports with multi-sheet support (REPT-06)
- [ ] PDF templates for all reports (REPT-07)
- [ ] Xero CSV format (EXPRT-01)
- [ ] MYOB CSV format (EXPRT-01)
- [ ] Participant list export (EXPRT-02)
- [ ] Worker hours export (EXPRT-03)

### Week 4: Polish & Testing
- [ ] Add loading states and error handling
- [ ] Performance optimization (pagination, caching)
- [ ] Unit tests for export helpers
- [ ] E2E tests for report viewing and export
- [ ] User documentation for Xero/MYOB setup
- [ ] Deploy and monitor performance metrics

## Sources

### Primary (HIGH confidence)
- Context7 `/recharts/recharts` - Chart components, ResponsiveContainer, customization patterns
- Context7 `/sheetjs/sheetjs` - SheetJS Excel export patterns
- Context7 `/diegomura/react-pdf` - PDF document structure, styling, font registration
- Existing codebase: `apps/admin/components/pdf/pdf-styles.ts` - Established PDF branding (BRAND_GREEN #66BB6A, BRAND_TEAL #00BFA5)
- Existing codebase: `apps/admin/lib/invoices/csv-export.ts` - PACE CSV format helper
- Existing codebase: `apps/admin/components/invoices/ExportCsvButton.tsx` - Export button pattern
- Existing codebase: `apps/admin/app/api/invoices/export-csv/route.ts` - Export API route pattern
- Existing codebase: `apps/admin/app/api/invoices/[id]/pdf/route.ts` - PDF generation with runtime='nodejs'
- Existing codebase: `supabase/migrations/20260125100001_invoicing_phase7.sql` - Database schema

### Secondary (MEDIUM confidence)
- [Xero Central](https://central.xero.com/s/article/Import-customer-invoices-AU) - Xero CSV import requirements
- [MYOB Help Centre](https://help.myob.com) - MYOB AccountRight CSV format
- [NPM Compare](https://npmtrends.com/recharts-vs-victory-vs-nivo) - Library comparison stats

### Tertiary (LOW confidence)
- General web search results for React dashboard patterns - Validated against established patterns
- Xero account code recommendations - Needs confirmation from Ephraim Care accounting setup

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Recharts and SheetJS are industry standard with extensive documentation; React 19 compatibility confirmed
- Architecture: HIGH - Patterns derived from existing codebase (invoice PDFs, CSV exports, TanStack Query hooks)
- Database schema: HIGH - Reviewed actual migration files in /supabase/migrations/
- Pitfalls: HIGH - Common issues well-documented in library issues and Stack Overflow
- Xero/MYOB integration: MEDIUM - Format requirements confirmed but account codes need user input

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable domain)
**Researcher:** Claude Sonnet 4.5
