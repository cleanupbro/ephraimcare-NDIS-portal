'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ephraimcare/ui'
import { List, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CalendarView } from '@/components/shifts/calendar-view'
import { ShiftDetailSheet } from '@/components/shifts/shift-detail-sheet'
import type { ShiftWithRelations } from '@ephraimcare/types'

interface Shift {
  id: string
  scheduled_start: string
  scheduled_end: string
  status: string
  support_type: string
  participants?: { first_name: string; last_name: string } | null
  workers?: { profiles: { first_name: string; last_name: string } | null } | null
}

export default function ShiftsCalendarPage() {
  const [selectedShift, setSelectedShift] = useState<ShiftWithRelations | null>(null)
  const [participantFilter, setParticipantFilter] = useState<string>('all')
  const [workerFilter, setWorkerFilter] = useState<string>('all')

  // Fetch shifts for 3-month window (prev, current, next month)
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts-calendar', participantFilter, workerFilter],
    queryFn: async () => {
      const supabase = createClient()
      const now = new Date()
      const start = subMonths(startOfMonth(now), 1)
      const end = addMonths(endOfMonth(now), 1)

      let query = supabase
        .from('shifts')
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          status,
          support_type,
          participants(first_name, last_name),
          workers(profiles(first_name, last_name))
        `)
        .gte('scheduled_start', start.toISOString())
        .lte('scheduled_start', end.toISOString())
        .neq('status', 'cancelled')
        .order('scheduled_start', { ascending: true })

      if (participantFilter !== 'all') {
        query = query.eq('participant_id', participantFilter)
      }
      if (workerFilter !== 'all') {
        query = query.eq('worker_id', workerFilter)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Shift[]
    },
  })

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['calendar-filter-options'],
    queryFn: async () => {
      const supabase = createClient()
      const [participantsRes, workersRes] = await Promise.all([
        supabase.from('participants').select('id, first_name, last_name').eq('is_active', true),
        supabase.from('workers').select('id, profiles(first_name, last_name)').eq('is_active', true),
      ])
      return {
        participants: participantsRes.data || [],
        workers: workersRes.data || [],
      }
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Shift Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Visual schedule overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/shifts">
              <List className="h-4 w-4 mr-2" />
              List View
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/shifts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Shift
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={participantFilter} onValueChange={setParticipantFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Participant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Participants</SelectItem>
            {filterOptions?.participants.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={workerFilter} onValueChange={setWorkerFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Worker" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workers</SelectItem>
            {filterOptions?.workers.map((w: any) => (
              <SelectItem key={w.id} value={w.id}>
                {w.profiles?.first_name} {w.profiles?.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar */}
      <CalendarView
        shifts={shifts || []}
        isLoading={isLoading}
        onShiftClick={(shift) => setSelectedShift(shift as unknown as ShiftWithRelations)}
      />

      {/* Shift Detail Sheet */}
      <ShiftDetailSheet
        shift={selectedShift}
        open={!!selectedShift}
        onClose={() => setSelectedShift(null)}
      />
    </div>
  )
}
