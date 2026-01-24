"use client"

import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import type { WorkerWithProfile } from '@ephraimcare/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ephraimcare/ui'
import { WorkerStats } from './worker-stats'
import { WorkerCompliance } from './worker-compliance'

interface WorkerDetailProps {
  worker: WorkerWithProfile
}

export function WorkerDetail({ worker }: WorkerDetailProps) {
  const fullName = `${worker.profiles.first_name} ${worker.profiles.last_name}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold">{fullName}</h1>
            {worker.employee_id && (
              <p className="text-sm text-muted-foreground">
                Employee ID: {worker.employee_id}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {worker.is_active ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="destructive">Inactive</Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/workers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/workers/${worker.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Stats Section */}
      <WorkerStats workerId={worker.id} />

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{worker.profiles.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-sm">{worker.profiles.phone ?? 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
              <p className="text-sm">
                {worker.hourly_rate != null
                  ? `$${worker.hourly_rate.toFixed(2)}/hr`
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Max Hours/Week</p>
              <p className="text-sm">
                {worker.max_hours_per_week != null
                  ? `${worker.max_hours_per_week} hrs`
                  : 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Types */}
      <Card>
        <CardHeader>
          <CardTitle>Support Types</CardTitle>
        </CardHeader>
        <CardContent>
          {worker.services_provided && worker.services_provided.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {worker.services_provided.map((service) => (
                <Badge key={service} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No support types assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle>Qualifications</CardTitle>
        </CardHeader>
        <CardContent>
          {worker.qualification && worker.qualification.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {worker.qualification.map((qual, index) => (
                <li key={index} className="text-sm">
                  {qual}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No qualifications recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Compliance */}
      <WorkerCompliance
        ndisCheckNumber={worker.ndis_check_number}
        ndisCheckExpiry={worker.ndis_check_expiry}
        wwccNumber={worker.wwcc_number}
        wwccExpiry={worker.wwcc_expiry}
      />
    </div>
  )
}
