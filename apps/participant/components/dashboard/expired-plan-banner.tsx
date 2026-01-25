'use client'

import { AlertTriangle } from 'lucide-react'

export function ExpiredPlanBanner() {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-800">Your NDIS plan has expired</h3>
          <p className="mt-1 text-sm text-red-700">
            Please contact your coordinator or support team to discuss your plan renewal.
          </p>
        </div>
      </div>
    </div>
  )
}
