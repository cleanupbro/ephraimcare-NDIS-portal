import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useShiftStore } from '../stores/shiftStore'
import { useSyncStore } from '../stores/syncStore'
import { useCurrentLocation } from './useLocation'
import { useQueryClient } from '@tanstack/react-query'

interface CheckOutResult {
  success: boolean
  durationMinutes?: number
  error?: string
}

export function useCheckOut() {
  const [loading, setLoading] = useState(false)
  const clearActiveShift = useShiftStore((s) => s.clearActiveShift)
  const activeShiftId = useShiftStore((s) => s.activeShiftId)
  const addPendingAction = useSyncStore((s) => s.addPendingAction)
  const { requestLocation } = useCurrentLocation()
  const queryClient = useQueryClient()

  async function checkOut(): Promise<CheckOutResult> {
    if (!activeShiftId) {
      return { success: false, error: 'No active shift to check out from' }
    }

    setLoading(true)
    try {
      const timestamp = new Date().toISOString()

      const coords = await requestLocation()

      const { data: checkInRecord } = (await supabase
        .from('shift_check_ins')
        .select('check_in_time')
        .eq('shift_id', activeShiftId)
        .single()) as any

      let durationMinutes: number | null = null
      if (checkInRecord?.check_in_time) {
        const checkInTime = new Date(checkInRecord.check_in_time)
        const checkOutTime = new Date(timestamp)
        durationMinutes = Math.round(
          (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)
        )
      }

      const updateData: any = {
        check_out_time: timestamp,
        check_out_type: 'manual',
        duration_minutes: durationMinutes,
      }
      if (coords) {
        updateData.check_out_latitude = coords.latitude
        updateData.check_out_longitude = coords.longitude
      }

      const { error: dbError } = await supabase
        .from('shift_check_ins')
        .update(updateData)
        .eq('shift_id', activeShiftId)

      if (dbError) {
        addPendingAction({
          type: 'check_out',
          shiftId: activeShiftId,
          timestamp,
          latitude: coords?.latitude ?? 0,
          longitude: coords?.longitude ?? 0,
        })
      }

      await supabase
        .from('shifts')
        .update({ status: 'completed' } as any)
        .eq('id', activeShiftId)

      const shiftIdForInvalidation = activeShiftId
      clearActiveShift()

      queryClient.invalidateQueries({ queryKey: ['shifts', 'detail', shiftIdForInvalidation] })
      queryClient.invalidateQueries({ queryKey: ['shifts'] })

      return { success: true, durationMinutes: durationMinutes ?? undefined }
    } finally {
      setLoading(false)
    }
  }

  return { checkOut, loading }
}
