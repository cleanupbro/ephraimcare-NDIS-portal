'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { IncidentCreateFormData, IncidentUpdateFormData } from '@/lib/incidents/schemas'

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const incidentKeys = {
  all: ['incidents'] as const,
  list: (filters?: IncidentFilters) => [...incidentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...incidentKeys.all, 'detail', id] as const,
}

interface IncidentFilters {
  status?: string
  severity?: string
  incident_type?: string
}

// ─── useIncidents ────────────────────────────────────────────────────────────

export function useIncidents(filters?: IncidentFilters) {
  const supabase = createClient()

  return useQuery({
    queryKey: incidentKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('incidents')
        .select(`
          *,
          participants(first_name, last_name),
          workers(profiles(first_name, last_name)),
          reporter:profiles!reported_by(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity)
      }
      if (filters?.incident_type && filters.incident_type !== 'all') {
        query = query.eq('incident_type', filters.incident_type)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
  })
}

// ─── useIncident ─────────────────────────────────────────────────────────────

export function useIncident(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          participants(first_name, last_name),
          workers(profiles(first_name, last_name)),
          reporter:profiles!reported_by(first_name, last_name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// ─── useCreateIncident ───────────────────────────────────────────────────────

export function useCreateIncident() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: IncidentCreateFormData & { organization_id: string; reported_by: string; requires_ndia_report: boolean }) => {
      const { data: incident, error } = await supabase
        .from('incidents')
        .insert(data as any)
        .select()
        .single()

      if (error) throw error
      return incident
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.all })
    },
  })
}

// ─── useUpdateIncident ───────────────────────────────────────────────────────

export function useUpdateIncident() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: IncidentUpdateFormData & { id: string }) => {
      const { data: incident, error } = await (supabase
        .from('incidents') as any)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return incident
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.all })
    },
  })
}

// ─── useMarkNdiaReported ─────────────────────────────────────────────────────

export function useMarkNdiaReported() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ndia_reference_number, ndia_reported_by }: { id: string; ndia_reference_number: string; ndia_reported_by: string }) => {
      const { data: incident, error } = await (supabase
        .from('incidents') as any)
        .update({
          ndia_reported_at: new Date().toISOString(),
          ndia_reference_number,
          ndia_reported_by,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return incident
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.all })
    },
  })
}

// ─── usePendingNdiaReports ───────────────────────────────────────────────────

export function usePendingNdiaReports() {
  const supabase = createClient()

  return useQuery({
    queryKey: [...incidentKeys.all, 'ndia-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('id, title, severity, incident_date, created_at')
        .eq('requires_ndia_report', true)
        .is('ndia_reported_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
  })
}
