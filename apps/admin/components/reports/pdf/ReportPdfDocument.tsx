import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'
import path from 'path'

import { EPHRAIM_CARE_DETAILS } from '@/lib/invoices/constants'

// ─── Brand Colors (matches pdf-styles.ts) ────────────────────────────────────

const BRAND_GREEN = '#66BB6A'
const BRAND_TEAL = '#00BFA5'

// ─── Font Registration ───────────────────────────────────────────────────────

/**
 * Register Inter fonts for PDF generation.
 * Must be called before rendering PDFs.
 * Gracefully falls back to Helvetica if fonts not found.
 */
function registerFonts(): void {
  try {
    const fontsDir = path.join(process.cwd(), 'public/fonts')

    Font.register({
      family: 'Inter',
      fonts: [
        { src: path.join(fontsDir, 'Inter-Regular.ttf'), fontWeight: 400 },
        { src: path.join(fontsDir, 'Inter-Medium.ttf'), fontWeight: 500 },
        { src: path.join(fontsDir, 'Inter-Bold.ttf'), fontWeight: 700 },
      ],
    })
  } catch (error) {
    console.warn('[PDF] Font registration failed, using fallback Helvetica:', error)
  }
}

// Register fonts on module load
registerFonts()

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Page layout
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Inter',
    backgroundColor: '#ffffff',
  },

  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_TEAL,
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND_GREEN,
  },
  companyInfo: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: BRAND_TEAL,
    textAlign: 'right',
  },
  dateRange: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  generatedAt: {
    fontSize: 8,
    color: '#999',
    textAlign: 'right',
    marginTop: 2,
  },

  // Summary cards section
  summarySection: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_TEAL,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#333',
  },

  // Data table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#fafafa',
  },
  headerCell: {
    fontSize: 8,
    fontWeight: 700,
    color: '#666',
    textTransform: 'uppercase',
  },
  cell: {
    fontSize: 9,
    color: '#333',
  },
  cellRight: {
    fontSize: 9,
    color: '#333',
    textAlign: 'right',
  },
  cellCenter: {
    fontSize: 9,
    color: '#333',
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 10,
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: 40,
    color: '#666',
    fontSize: 11,
  },
})

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReportColumn<T> {
  header: string
  key: keyof T
  width?: string
  align?: 'left' | 'right' | 'center'
  format?: (value: unknown) => string
}

export interface ReportPdfDocumentProps<T> {
  title: string
  dateRange: {
    from: Date
    to: Date
  }
  summaries?: Array<{
    label: string
    value: string | number
  }>
  columns: ReportColumn<T>[]
  data: T[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateRange(from: Date, to: Date): string {
  return `${format(from, 'dd MMM yyyy')} - ${format(to, 'dd MMM yyyy')}`
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function getCellStyle(align?: 'left' | 'right' | 'center') {
  if (align === 'right') return styles.cellRight
  if (align === 'center') return styles.cellCenter
  return styles.cell
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Generic PDF document component for report exports.
 * Uses Ephraim Care branding with header, summary cards, and data table.
 *
 * @example
 * ```tsx
 * <ReportPdfDocument
 *   title="Budget Utilization Report"
 *   dateRange={{ from: new Date(), to: new Date() }}
 *   summaries={[{ label: 'Total', value: '$10,000' }]}
 *   columns={[
 *     { header: 'Name', key: 'name', width: '40%' },
 *     { header: 'Amount', key: 'amount', width: '30%', align: 'right' },
 *   ]}
 *   data={reportData}
 * />
 * ```
 */
export function ReportPdfDocument<T extends Record<string, unknown>>({
  title,
  dateRange,
  summaries = [],
  columns,
  data,
}: ReportPdfDocumentProps<T>) {
  // Calculate default column width if not specified
  const defaultWidth = `${Math.floor(100 / columns.length)}%`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{EPHRAIM_CARE_DETAILS.name}</Text>
            <Text style={styles.companyInfo}>ABN: {EPHRAIM_CARE_DETAILS.abn}</Text>
            <Text style={styles.companyInfo}>{EPHRAIM_CARE_DETAILS.address}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>{title}</Text>
            <Text style={styles.dateRange}>
              {formatDateRange(dateRange.from, dateRange.to)}
            </Text>
            <Text style={styles.generatedAt}>
              Generated: {format(new Date(), "dd MMM yyyy 'at' HH:mm")}
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        {summaries.length > 0 && (
          <View style={styles.summarySection}>
            {summaries.slice(0, 4).map((summary, index) => (
              <View key={index} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{summary.label}</Text>
                <Text style={styles.summaryValue}>{summary.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Data Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {columns.map((col, index) => (
              <Text
                key={index}
                style={[
                  styles.headerCell,
                  { width: col.width || defaultWidth },
                  col.align === 'right' && { textAlign: 'right' },
                  col.align === 'center' && { textAlign: 'center' },
                ]}
              >
                {col.header}
              </Text>
            ))}
          </View>

          {/* Table Rows */}
          {data.length === 0 ? (
            <View style={styles.emptyState}>
              <Text>No data available for the selected period.</Text>
            </View>
          ) : (
            data.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                {columns.map((col, colIndex) => {
                  const rawValue = row[col.key]
                  const displayValue = col.format
                    ? col.format(rawValue)
                    : formatValue(rawValue)

                  return (
                    <Text
                      key={colIndex}
                      style={[
                        getCellStyle(col.align),
                        { width: col.width || defaultWidth },
                      ]}
                    >
                      {displayValue}
                    </Text>
                  )
                })}
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by OpBros | {EPHRAIM_CARE_DETAILS.email} | {EPHRAIM_CARE_DETAILS.phone}
        </Text>
      </Page>
    </Document>
  )
}
