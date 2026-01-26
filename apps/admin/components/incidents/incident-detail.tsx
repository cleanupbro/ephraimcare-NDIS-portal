'use client'

import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ephraimcare/ui'
import { Pencil, CheckCircle, User, Briefcase, Calendar, MapPin, Clock } from 'lucide-react'
import { NdiaCountdown } from './ndia-countdown'
import { NdiaReportDialog } from './ndia-report-dialog'
import { useUpdateIncident } from '@/hooks/use-incidents'
import {
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/lib/incidents/constants'

interface Incident {
  id: string
  title: string
  description: string
  incident_type: string
  severity: string
  status: string
  location: string | null
  actions_taken: string | null
  incident_date: string
  requires_ndia_report: boolean
  ndia_reported_at: string | null
  ndia_reference_number: string | null
  created_at: string
  closed_at: string | null
  participants?: { id: string; first_name: string; last_name: string; ndis_number: string } | null
  workers?: { id: string; profiles: { first_name: string; last_name: string } | null } | null
  reporter?: { first_name: string; last_name: string } | null
  closer?: { first_name: string; last_name: string } | null
  ndia_reporter?: { first_name: string; last_name: string } | null
  shifts?: { id: string; scheduled_start: string; scheduled_end: string } | null
}

interface IncidentDetailProps {
  incident: Incident
  userId: string
}

export function IncidentDetail({ incident, userId }: IncidentDetailProps) {
  const router = useRouter()
  const updateIncident = useUpdateIncident()

  const needsNdiaReport = incident.requires_ndia_report && !incident.ndia_reported_at
  const isClosed = incident.status === 'closed'

  async function handleClose() {
    updateIncident.mutate(
      {
        id: incident.id,
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: userId,
      },
      {
        onSuccess: () => {
          router.refresh()
        },
      }
    )
  }

  async function handleReopen() {
    updateIncident.mutate(
      {
        id: incident.id,
        status: 'open',
        closed_at: null,
        closed_by: null,
      },
      {
        onSuccess: () => {
          router.refresh()
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl font-bold">{incident.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline">
              {INCIDENT_TYPE_LABELS[incident.incident_type as IncidentType]}
            </Badge>
            <Badge className={SEVERITY_COLORS[incident.severity as IncidentSeverity]}>
              {SEVERITY_LABELS[incident.severity as IncidentSeverity]}
            </Badge>
            <Badge className={STATUS_COLORS[incident.status as IncidentStatus]}>
              {STATUS_LABELS[incident.status as IncidentStatus]}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/incidents/${incident.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          {!isClosed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={updateIncident.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Close Incident
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReopen}
              disabled={updateIncident.isPending}
            >
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* NDIA Banner */}
      {needsNdiaReport && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <NdiaCountdown incidentDate={incident.incident_date} />
          <NdiaReportDialog
            incidentId={incident.id}
            incidentTitle={incident.title}
            userId={userId}
            onSuccess={() => router.refresh()}
          />
        </div>
      )}

      {/* NDIA Reported Badge */}
      {incident.ndia_reported_at && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Reported to NDIA</p>
            <p className="text-xs text-green-700">
              Reference: {incident.ndia_reference_number} •
              Reported {format(parseISO(incident.ndia_reported_at), 'd MMM yyyy, h:mm a')}
              {incident.ndia_reporter && (
                <> by {incident.ndia_reporter.first_name} {incident.ndia_reporter.last_name}</>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incident Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Description
              </h4>
              <p className="text-sm whitespace-pre-wrap">{incident.description}</p>
            </div>

            {incident.actions_taken && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Actions Taken
                </h4>
                <p className="text-sm whitespace-pre-wrap">{incident.actions_taken}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(parseISO(incident.incident_date), 'd MMM yyyy, h:mm a')}</span>
              </div>
              {incident.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{incident.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related Records Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incident.participants && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Link
                    href={`/participants/${incident.participants.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {incident.participants.first_name} {incident.participants.last_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    NDIS #{incident.participants.ndis_number}
                  </p>
                </div>
              </div>
            )}

            {incident.workers && incident.workers.profiles && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <Link
                    href={`/workers/${incident.workers.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {incident.workers.profiles.first_name} {incident.workers.profiles.last_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">Support Worker</p>
                </div>
              </div>
            )}

            {incident.shifts && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <Link
                    href={`/shifts/${incident.shifts.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    Related Shift
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(incident.shifts.scheduled_start), 'd MMM yyyy, h:mm a')}
                  </p>
                </div>
              </div>
            )}

            {!incident.participants && !incident.workers && !incident.shifts && (
              <p className="text-sm text-muted-foreground">No related records</p>
            )}
          </CardContent>
        </Card>

        {/* Audit Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Reported by: </span>
                {incident.reporter && (
                  <span>{incident.reporter.first_name} {incident.reporter.last_name}</span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Created: </span>
                <span>{format(parseISO(incident.created_at), 'd MMM yyyy, h:mm a')}</span>
              </div>
              {incident.closed_at && incident.closer && (
                <div>
                  <span className="text-muted-foreground">Closed by: </span>
                  <span>
                    {incident.closer.first_name} {incident.closer.last_name} on{' '}
                    {format(parseISO(incident.closed_at), 'd MMM yyyy, h:mm a')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
