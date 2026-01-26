'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { BulkShiftWizard } from '@/components/shifts/BulkShiftWizard'
import { useOrganization } from '@/hooks/use-organization'
import { Skeleton } from '@ephraimcare/ui'

// ─── Page Component ─────────────────────────────────────────────────────────

export default function BulkShiftsPage() {
  const router = useRouter()
  const { data: organization, isLoading } = useOrganization()

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="h-[600px] max-w-4xl mx-auto rounded-lg" />
      </div>
    )
  }

  // No organization - should not happen for authenticated users
  if (!organization?.id) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-destructive">Organization not found</h1>
          <p className="text-muted-foreground">Unable to load organization details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Link
        href="/shifts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Shifts
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Recurring Shifts</h1>
        <p className="text-muted-foreground">
          Schedule multiple shifts at once with pattern-based creation
        </p>
      </div>

      <BulkShiftWizard
        organizationId={organization.id}
        onComplete={() => router.push('/shifts')}
        onCancel={() => router.back()}
      />
    </div>
  )
}
