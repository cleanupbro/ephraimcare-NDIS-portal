'use client'

import { Card, CardContent, CardHeader, CardTitle, Badge } from '@ephraimcare/ui'
import { Users, AlertTriangle, FileText, AlertCircle } from 'lucide-react'
import type { ComplianceMetrics } from '@/hooks/use-compliance'

interface ComplianceBreakdownProps {
  metrics: ComplianceMetrics | undefined
  isLoading: boolean
}

export function ComplianceBreakdown({ metrics, isLoading }: ComplianceBreakdownProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-24 flex items-center justify-center">
                <span className="text-muted-foreground">Loading...</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Workers Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Worker Compliance</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.workers.rate}%</div>
          <p className="text-xs text-muted-foreground mb-3">
            {metrics.workers.valid} of {metrics.workers.total} workers compliant
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {metrics.workers.valid} Valid
            </Badge>
            {metrics.workers.expiring > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {metrics.workers.expiring} Expiring
              </Badge>
            )}
            {metrics.workers.expired > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {metrics.workers.expired} Expired
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Incidents Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Incident Resolution</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.incidents.rate}%</div>
          <p className="text-xs text-muted-foreground mb-3">
            {metrics.incidents.closed} of {metrics.incidents.total} resolved this month
          </p>
          <div className="flex flex-wrap gap-2">
            {metrics.incidents.open > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {metrics.incidents.open} Open
              </Badge>
            )}
            {metrics.incidents.inReview > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {metrics.incidents.inReview} In Review
              </Badge>
            )}
            {metrics.incidents.pendingNdia > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                {metrics.incidents.pendingNdia} NDIA Pending
              </Badge>
            )}
            {metrics.incidents.total === 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                No incidents
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentation Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Documentation</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.documentation.rate}%</div>
          <p className="text-xs text-muted-foreground mb-3">
            {metrics.documentation.withActivePlan} of {metrics.documentation.totalParticipants} with active plans
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {metrics.documentation.withActivePlan} Complete
            </Badge>
            {metrics.documentation.totalParticipants - metrics.documentation.withActivePlan > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {metrics.documentation.totalParticipants - metrics.documentation.withActivePlan} Incomplete
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
