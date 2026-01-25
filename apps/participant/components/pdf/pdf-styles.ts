import { Font, StyleSheet } from '@react-pdf/renderer'
import path from 'path'

// ─── Ephraim Care Brand Colors ──────────────────────────────────────────────────

const BRAND_GREEN = '#66BB6A'
const BRAND_TEAL = '#00BFA5'

// ─── Font Registration ──────────────────────────────────────────────────────────

/**
 * Register Inter fonts for PDF generation.
 * Must be called before rendering PDFs.
 * Gracefully falls back to Helvetica if fonts not found.
 */
export function registerFonts(): void {
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
    // Graceful fallback to Helvetica if fonts not found
    console.warn('[PDF] Font registration failed, using fallback Helvetica:', error)
  }
}

// ─── Shared PDF Styles ──────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
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
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 40,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: BRAND_GREEN,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: BRAND_TEAL,
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    color: '#333',
  },
  periodText: {
    fontSize: 9,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },

  // From/To section
  fromTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  fromBlock: {
    width: '50%',
  },
  toBlock: {
    width: '50%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: BRAND_TEAL,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
    color: '#333',
  },
  textBold: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
    color: '#333',
  },

  // Line items table
  section: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#fafafa',
  },
  headerText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#666',
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 9,
    color: '#333',
  },
  cellRight: {
    fontSize: 9,
    color: '#333',
    textAlign: 'right',
  },

  // Column widths for line items table
  colDate: { width: '14%' },
  colService: { width: '20%' },
  colDayType: { width: '14%' },
  colHours: { width: '12%', textAlign: 'right' },
  colRate: { width: '18%', textAlign: 'right' },
  colTotal: { width: '22%', textAlign: 'right' },

  // Totals section
  totalsBlock: {
    marginTop: 25,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 220,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 500,
    color: '#333',
  },
  grandTotal: {
    flexDirection: 'row',
    width: 220,
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: BRAND_TEAL,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 700,
    color: BRAND_TEAL,
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

  // Draft watermark
  draftWatermark: {
    position: 'absolute',
    top: '45%',
    left: '22%',
    fontSize: 72,
    color: '#e0e0e0',
    fontWeight: 700,
    transform: 'rotate(-30deg)',
    opacity: 0.5,
  },

  // Payment details section
  paymentSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#333',
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
})
