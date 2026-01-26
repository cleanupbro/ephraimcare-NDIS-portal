import Link from 'next/link'
import { startOfWeek, endOfWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@ephraimcare/ui'
import { Plus, Calendar, Repeat } from 'lucide-react'
import { ShiftList } from '@/components/shifts/shift-list'
import type { ShiftWithRelations } from '@ephraimcare/types'

export default async function ShiftsPage() {
  const supabase = await createClient()

  // Fetch current week's shifts for SSR initial data
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const { data } = await (supabase
    .from('shifts')
    .select(
      '*, participants(id, first_name, last_name), workers(id, services_provided, profiles(first_name, last_name))'
    )
    .gte('scheduled_start', weekStart.toISOString())
    .lte('scheduled_start', weekEnd.toISOString())
    .order('scheduled_start', { ascending: true }) as any)

  const shifts = (data as ShiftWithRelations[]) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Shifts</h1>
          <p className="text-sm text-muted-foreground">
            Weekly shift schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/shifts/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shifts/recurring">
              <Repeat className="mr-2 h-4 w-4" />
              Recurring
            </Link>
          </Button>
          <Button asChild>
            <Link href="/shifts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Shift
            </Link>
          </Button>
        </div>
      </div>

      <ShiftList initialData={shifts} />
    </div>
  )
}
