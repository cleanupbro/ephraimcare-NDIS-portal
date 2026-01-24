"use client"

import Link from 'next/link'
import { format, parseISO, differenceInYears } from 'date-fns'
import { Pencil } from 'lucide-react'
import type { Participant, NdisPlan, PlanBudget } from '@ephraimcare/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@ephraimcare/ui'
import { BudgetProgress } from './participant-budget'
import { PlanCountdown } from './participant-plan-badge'
import { ArchiveDialog } from './archive-dialog'
import { CaseNotesTab } from './case-notes-tab'

interface ParticipantDetailProps {
  participant: Participant
  plan: NdisPlan | null
  budgets: PlanBudget[]
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not provided'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return 'Invalid date'
  }
}

function calculateAge(dob: string | null | undefined): string {
  if (!dob) return ''
  try {
    const years = differenceInYears(new Date(), parseISO(dob))
    return `(${years} years old)`
  } catch {
    return ''
  }
}

function formatAddress(participant: Participant): string {
  const parts = [
    participant.address_line_1,
    participant.address_line_2,
    participant.suburb,
    participant.state,
    participant.postcode,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Not provided'
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ParticipantDetail({ participant, plan, budgets }: ParticipantDetailProps) {
  const totalUsed = budgets.reduce((sum, b) => sum + b.used_amount, 0)
  const totalAllocated = plan?.total_budget ?? 0

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {participant.first_name} {participant.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            NDIS: {participant.ndis_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlanCountdown endDate={plan?.end_date ?? null} />
          {!participant.is_active && (
            <Badge variant="destructive">Archived</Badge>
          )}
          {participant.is_active && (
            <Badge variant="default">Active</Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link href={`/participants/${participant.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        {participant.is_active && (
          <ArchiveDialog
            participantId={participant.id}
            participantName={`${participant.first_name} ${participant.last_name}`}
          />
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="case-notes">Case Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-4">
          {/* NDIS Plan Section */}
          <Card>
            <CardHeader>
              <CardTitle>NDIS Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {plan ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Plan Number</p>
                      <p className="text-sm">{plan.plan_number ?? 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="text-sm">{formatDate(plan.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">End Date</p>
                      <p className="text-sm">{formatDate(plan.end_date)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Budget Utilization
                    </p>
                    <BudgetProgress allocated={totalAllocated} used={totalUsed} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active plan</p>
              )}
            </CardContent>
          </Card>

          {/* Budget Breakdown Section */}
          {budgets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-medium text-muted-foreground">Category</th>
                        <th className="pb-2 font-medium text-muted-foreground">Subcategory</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Allocated</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Used</th>
                        <th className="pb-2 text-right font-medium text-muted-foreground">Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgets.map((budget) => (
                        <tr key={budget.id} className="border-b last:border-0">
                          <td className="py-2">{budget.category}</td>
                          <td className="py-2 text-muted-foreground">
                            {budget.subcategory ?? '-'}
                          </td>
                          <td className="py-2 text-right">{formatAUD(budget.allocated_amount)}</td>
                          <td className="py-2 text-right">{formatAUD(budget.used_amount)}</td>
                          <td className="py-2 text-right">
                            {formatAUD(budget.allocated_amount - budget.used_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="text-sm">
                    {formatDate(participant.date_of_birth)}{' '}
                    <span className="text-muted-foreground">
                      {calculateAge(participant.date_of_birth)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{participant.phone ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{participant.email ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">{formatAddress(participant)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              {participant.emergency_contact_name || participant.emergency_contact_phone ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm">
                      {participant.emergency_contact_name ?? 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm">
                      {participant.emergency_contact_phone ?? 'Not provided'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No emergency contact on file</p>
              )}
            </CardContent>
          </Card>

          {/* Support Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Support Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {participant.notes ? (
                <p className="whitespace-pre-wrap text-sm">{participant.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No support notes recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="case-notes" className="mt-4">
          <CaseNotesTab
            participantId={participant.id}
            organizationId={participant.organization_id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
