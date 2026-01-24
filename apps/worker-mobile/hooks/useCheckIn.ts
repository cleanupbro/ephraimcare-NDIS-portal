import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { isWithinRadius } from '../lib/proximity'
import { useSyncStore } from '../stores/syncStore'
import { useShiftStore } from '../stores/shiftStore'
import { useCurrentLocation } from './useLocation'
import { CHECK_IN_RADIUS_METERS } from '../constants/config'
import { useQueryClient } from '@tanstack/react-query'

interface CheckInResult {
  success: boolean
  error?: string
  distance?: number
}

export function useCheckIn() {
  const [loading, setLoading] = useState(false)
  const addPendingAction = useSyncStore((s) => s.addPendingAction)
  const setActiveShift = useShiftStore((s) => s.setActiveShift)
  const { requestLocation } = useCurrentLocation()
  const queryClient = useQueryClient()

  async function checkIn(
    shiftId: string,
    participantLat: number | null,
    participantLon: number | null,
    participantName: string
  ): Promise<CheckInResult> {
    if (participantLat === null || participantLon === null) {
      return { success: false, error: 'Participant address has no GPS coordinates. Contact admin.' }
    }

    setLoading(true)
    try {
      const coords = await requestLocation()
      if (!coords) {
        return { success: false, error: 'Could not get your location. Check permissions.' }
      }

      const { within, distance } = isWithinRadius(
        coords.latitude,
        coords.longitude,
        participantLat,
        participantLon,
        CHECK_IN_RADIUS_METERS
      )

      if (!within) {
        return {
          success: false,
          error: `You are ${distance}m away. Must be within ${CHECK_IN_RADIUS_METERS}m to check in.`,
          distance,
        }
      }

      const timestamp = new Date().toISOString()
      const { error: dbError } = await supabase
        .from('shift_check_ins')
        .insert({
          shift_id: shiftId,
          check_in_time: timestamp,
          check_in_latitude: coords.latitude,
          check_in_longitude: coords.longitude,
        } as any)

      if (dbError) {
        addPendingAction({
          type: 'check_in',
          shiftId,
          timestamp,
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      }

      await supabase
        .from('shifts')
        .update({ status: 'in_progress' } as any)
        .eq('id', shiftId)

      setActiveShift(shiftId, new Date(timestamp), participantName)

      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['shift', shiftId] })

      return { success: true }
    } finally {
      setLoading(false)
    }
  }

  return { checkIn, loading }
}
