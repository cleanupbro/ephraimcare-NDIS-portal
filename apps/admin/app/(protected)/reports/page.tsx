import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@ephraimcare/ui'
import { DollarSign, TrendingUp, Clock, Users } from 'lucide-react'
import { REPORT_TYPES } from '@/lib/reports/constants'

// ─── Icon Map ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof DollarSign> = {
  DollarSign,
  TrendingUp,
  Clock,
  Users,
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and export reports for budgets, revenue, workers, and participants.
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {REPORT_TYPES.map((report) => {
          const Icon = ICON_MAP[report.icon] || DollarSign

          return (
            <Link key={report.id} href={report.href}>
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Options</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>CSV:</strong> Comma-separated values for spreadsheet imports.
          </p>
          <p>
            <strong>Excel:</strong> Native XLSX format with formatting preserved.
          </p>
          <p>
            <strong>PDF:</strong> Print-ready document for sharing and archival.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
