'use client'

import Link from 'next/link'
import { Shield, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Badge } from '@ephraimcare/ui'
import { getComplianceStatus } from '@/lib/workers/constants'

interface ComplianceWorker {
  id: string
  ndis_check_expiry: string | null
  wwcc_expiry: string | null
  profiles: {
    first_name: string
    last_name: string
  }
}

interface ComplianceWidgetProps {
  workers: ComplianceWorker[]
}

export function ComplianceWidget({ workers }: ComplianceWidgetProps) {
  if (workers.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Compliance Status
        </h2>
        <p className="text-sm text-muted-foreground">
          All workers have valid screening checks.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        Compliance Alerts
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {workers.length} worker{workers.length !== 1 ? 's' : ''} with screening checks requiring attention
      </p>
      <div className="space-y-2">
        {workers.map((worker) => {
          const ndisStatus = getComplianceStatus(worker.ndis_check_expiry)
          const isExpired = ndisStatus === 'expired'
          return (
            <Link
              key={worker.id}
              href={`/workers/${worker.id}`}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">
                  {worker.profiles.first_name} {worker.profiles.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  NDIS check {isExpired ? 'expired' : 'expires'}:{' '}
                  {worker.ndis_check_expiry
                    ? format(parseISO(worker.ndis_check_expiry), 'd MMM yyyy')
                    : 'Not set'}
                </p>
              </div>
              <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                {isExpired ? 'Expired' : 'Expiring'}
              </Badge>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
