'use client'

import { Download, RefreshCw } from 'lucide-react'
import { Button } from '@ephraimcare/ui'
import { useComplianceMetrics } from '@/hooks/use-compliance'
import { HealthScoreCard } from '@/components/compliance/health-score-card'
import { ComplianceBreakdown } from '@/components/compliance/compliance-breakdown'
import { useState } from 'react'

export default function CompliancePage() {
  const { data: metrics, isLoading, refetch } = useComplianceMetrics()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const response = await fetch('/api/compliance/report')
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Compliance Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor organizational compliance health and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Health Score Hero */}
      <div className="max-w-xs mx-auto">
        <HealthScoreCard score={metrics?.overallScore || 0} isLoading={isLoading} />
      </div>

      {/* Breakdown Grid */}
      <ComplianceBreakdown metrics={metrics} isLoading={isLoading} />

      {/* Legend */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-2">Score Calculation</h3>
        <p className="text-xs text-muted-foreground">
          Overall compliance score is calculated as a weighted average: Worker Compliance (40%) +
          Incident Resolution (30%) + Documentation (30%). Scores are color-coded:
          <span className="text-green-600 font-medium"> Green (80%+)</span>,
          <span className="text-amber-600 font-medium"> Amber (60-79%)</span>,
          <span className="text-red-600 font-medium"> Red (&lt;60%)</span>.
        </p>
      </div>
    </div>
  )
}
