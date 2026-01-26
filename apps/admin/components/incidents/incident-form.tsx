'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  Label,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@ephraimcare/ui'
import { createClient } from '@/lib/supabase/client'
import { incidentCreateSchema, type IncidentCreateFormData } from '@/lib/incidents/schemas'
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  INCIDENT_SEVERITIES,
  SEVERITY_LABELS,
  requiresNdiaReport,
  type IncidentType,
  type IncidentSeverity,
} from '@/lib/incidents/constants'
import { useCreateIncident } from '@/hooks/use-incidents'

interface Participant {
  id: string
  first_name: string
  last_name: string
  organization_id: string
}

interface Worker {
  id: string
  profiles: { first_name: string; last_name: string } | null
}

export function IncidentForm() {
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [userId, setUserId] = useState<string>('')
  const [organizationId, setOrganizationId] = useState<string>('')

  const createIncident = useCreateIncident()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IncidentCreateFormData>({
    resolver: zodResolver(incidentCreateSchema),
    defaultValues: {
      incident_type: undefined,
      severity: undefined,
      title: '',
      description: '',
      actions_taken: '',
      location: '',
      incident_date: new Date().toISOString().slice(0, 16),
      participant_id: null,
      worker_id: null,
    },
  })

  const incidentType = watch('incident_type') as IncidentType | undefined
  const severity = watch('severity') as IncidentSeverity | undefined

  // Fetch data on mount
  useEffect(() => {
    const supabase = createClient()

    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const [participantsRes, workersRes] = await Promise.all([
        supabase
          .from('participants')
          .select('id, first_name, last_name, organization_id')
          .eq('is_active', true)
          .order('first_name'),
        supabase
          .from('workers')
          .select('id, profiles(first_name, last_name)')
          .eq('is_active', true)
          .order('created_at'),
      ])

      if (participantsRes.data) {
        setParticipants(participantsRes.data as unknown as Participant[])
        if (participantsRes.data.length > 0) {
          setOrganizationId((participantsRes.data[0] as any).organization_id)
        }
      }
      if (workersRes.data) {
        setWorkers(workersRes.data as unknown as Worker[])
      }
    }

    fetchData()
  }, [])

  const showNdiaWarning = incidentType && severity && requiresNdiaReport(incidentType, severity)

  async function onSubmit(data: IncidentCreateFormData) {
    const requiresNdia = data.incident_type && data.severity
      ? requiresNdiaReport(data.incident_type as IncidentType, data.severity as IncidentSeverity)
      : false

    createIncident.mutate(
      {
        ...data,
        organization_id: organizationId,
        reported_by: userId,
        requires_ndia_report: requiresNdia,
        incident_date: new Date(data.incident_date).toISOString(),
      },
      {
        onSuccess: () => {
          router.push('/incidents')
        },
      }
    )
  }

  return (
    <>
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Incidents
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
        {/* NDIA Warning */}
        {showNdiaWarning && (
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">NDIA Notification Required</p>
              <p className="text-xs text-red-700 mt-1">
                This incident type/severity requires notification to NDIA within 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* Incident Type */}
        <div className="space-y-2">
          <Label htmlFor="incident_type">Incident Type</Label>
          <Select
            value={incidentType}
            onValueChange={(val) => setValue('incident_type', val as IncidentType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select incident type" />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {INCIDENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.incident_type && (
            <p className="text-sm text-destructive">{errors.incident_type.message}</p>
          )}
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select
            value={severity}
            onValueChange={(val) => setValue('severity', val as IncidentSeverity)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_SEVERITIES.map((sev) => (
                <SelectItem key={sev} value={sev}>
                  {SEVERITY_LABELS[sev]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.severity && (
            <p className="text-sm text-destructive">{errors.severity.message}</p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Brief title for the incident"
            {...register('title')}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Detailed description of what happened..."
            rows={5}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* Participant (optional) */}
        <div className="space-y-2">
          <Label htmlFor="participant_id">Related Participant (optional)</Label>
          <Select
            value={watch('participant_id') || ''}
            onValueChange={(val) => setValue('participant_id', val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select participant (optional)" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Worker (optional) */}
        <div className="space-y-2">
          <Label htmlFor="worker_id">Related Worker (optional)</Label>
          <Select
            value={watch('worker_id') || ''}
            onValueChange={(val) => setValue('worker_id', val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select worker (optional)" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.profiles?.first_name} {w.profiles?.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Incident Date/Time */}
        <div className="space-y-2">
          <Label htmlFor="incident_date">Date & Time of Incident</Label>
          <Input
            type="datetime-local"
            id="incident_date"
            {...register('incident_date')}
          />
          {errors.incident_date && (
            <p className="text-sm text-destructive">{errors.incident_date.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <Input
            id="location"
            placeholder="Where did the incident occur?"
            {...register('location')}
          />
        </div>

        {/* Actions Taken */}
        <div className="space-y-2">
          <Label htmlFor="actions_taken">Immediate Actions Taken (optional)</Label>
          <Textarea
            id="actions_taken"
            placeholder="What actions were taken in response?"
            rows={3}
            {...register('actions_taken')}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || createIncident.isPending}
          >
            {createIncident.isPending ? 'Submitting...' : 'Report Incident'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/incidents">Cancel</Link>
          </Button>
        </div>
      </form>
    </>
  )
}
