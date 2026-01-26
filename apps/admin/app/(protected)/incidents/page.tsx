'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Plus, AlertTriangle } from 'lucide-react'
import { Button, Badge, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ephraimcare/ui'
import { useIncidents } from '@/hooks/use-incidents'
import {
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  INCIDENT_TYPES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/lib/incidents/constants'

export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data: incidents, isLoading } = useIncidents({
    status: statusFilter,
    severity: severityFilter,
    incident_type: typeFilter,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Incidents</h1>
          <p className="text-sm text-muted-foreground">
            Report and manage incident records
          </p>
        </div>
        <Button asChild>
          <Link href="/incidents/new">
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {INCIDENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {INCIDENT_SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>{SEVERITY_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {INCIDENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading incidents...</div>
      ) : !incidents?.length ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No incidents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident: any) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{incident.title}</h3>
                    {incident.requires_ndia_report && !incident.ndia_reported_at && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        NDIA Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {incident.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{INCIDENT_TYPE_LABELS[incident.incident_type as IncidentType]}</span>
                    <span>•</span>
                    <span>{format(parseISO(incident.incident_date), 'd MMM yyyy, h:mm a')}</span>
                    {incident.participants && (
                      <>
                        <span>•</span>
                        <span>{incident.participants.first_name} {incident.participants.last_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={SEVERITY_COLORS[incident.severity as IncidentSeverity]}>
                    {SEVERITY_LABELS[incident.severity as IncidentSeverity]}
                  </Badge>
                  <Badge className={STATUS_COLORS[incident.status as IncidentStatus]}>
                    {STATUS_LABELS[incident.status as IncidentStatus]}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
