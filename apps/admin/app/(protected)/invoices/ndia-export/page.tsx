'use client'

import { useOrganization } from '@/hooks/use-organization'
import { NdiaCsvExport } from '@/components/invoices/NdiaCsvExport'
import { Loader2 } from 'lucide-react'

export default function NdiaExportPage() {
  const { data: organization, isLoading } = useOrganization()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const hasRegistration = !!(organization as any)?.ndis_registration_number

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">NDIA Claim Export</h1>
        <p className="text-muted-foreground">
          Export finalized invoices to PACE CSV format for myplace portal submission
        </p>
      </div>

      <NdiaCsvExport organizationHasRegistration={hasRegistration} />
    </div>
  )
}
